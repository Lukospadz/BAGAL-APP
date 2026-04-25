-- Props betting system: prop_bets + player_bets

CREATE TABLE IF NOT EXISTS prop_bets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id    UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  description      TEXT NOT NULL,
  target_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  odds             NUMERIC(6,2) NOT NULL CHECK (odds >= 1.1),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'voided')),
  result           BOOLEAN,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_bets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prop_bet_id      UUID NOT NULL REFERENCES prop_bets(id) ON DELETE CASCADE,
  player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount           INTEGER NOT NULL CHECK (amount >= 50),
  potential_payout INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'voided')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at       TIMESTAMPTZ,
  UNIQUE(prop_bet_id, player_id)
);

-- ─── RPCs ────────────────────────────────────────────────────────────────────

-- Admin: replace all open props for a tournament
CREATE OR REPLACE FUNCTION save_prop_bets(
  p_tournament_id UUID,
  p_bets          JSONB
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;

  -- Only wipe open props; leave settled/voided ones alone
  DELETE FROM prop_bets
  WHERE tournament_id = p_tournament_id AND status = 'open';

  INSERT INTO prop_bets (tournament_id, type, description, target_player_id, odds)
  SELECT
    p_tournament_id,
    (bet->>'type')::TEXT,
    (bet->>'description')::TEXT,
    NULLIF(bet->>'target_player_id', '')::UUID,
    (bet->>'odds')::NUMERIC
  FROM jsonb_array_elements(p_bets) AS bet;
END;
$$;

-- Admin: edit description and odds on a single open bet
CREATE OR REPLACE FUNCTION update_prop_bet(
  p_bet_id      UUID,
  p_description TEXT,
  p_odds        NUMERIC
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE prop_bets
  SET description = p_description, odds = p_odds
  WHERE id = p_bet_id AND status = 'open';
END;
$$;

-- Admin: void a bet and refund all wagers
CREATE OR REPLACE FUNCTION void_prop_bet(p_bet_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;

  -- Refund each player who wagered
  UPDATE players p
  SET bagal_bucks = bagal_bucks + pb.amount
  FROM player_bets pb
  WHERE pb.prop_bet_id = p_bet_id AND pb.player_id = p.id AND pb.status = 'pending';

  INSERT INTO bucks_transactions (player_id, amount, reason)
  SELECT player_id, amount, 'prop_void:' || p_bet_id
  FROM player_bets
  WHERE prop_bet_id = p_bet_id AND status = 'pending';

  UPDATE player_bets
  SET status = 'voided', settled_at = NOW()
  WHERE prop_bet_id = p_bet_id AND status = 'pending';

  UPDATE prop_bets SET status = 'voided' WHERE id = p_bet_id;
END;
$$;

-- Admin: manually mark the result of a single bet (used for hole_in_one, tilt, etc.)
CREATE OR REPLACE FUNCTION mark_prop_result(p_bet_id UUID, p_won BOOLEAN)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_pb player_bets%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;

  UPDATE prop_bets SET status = 'settled', result = p_won WHERE id = p_bet_id;

  FOR v_pb IN
    SELECT * FROM player_bets WHERE prop_bet_id = p_bet_id AND status = 'pending'
  LOOP
    IF p_won THEN
      UPDATE player_bets SET status = 'won', settled_at = NOW() WHERE id = v_pb.id;
      UPDATE players SET bagal_bucks = bagal_bucks + v_pb.potential_payout WHERE id = v_pb.player_id;
      INSERT INTO bucks_transactions (player_id, amount, reason)
      VALUES (v_pb.player_id, v_pb.potential_payout, 'prop_win:' || p_bet_id);
    ELSE
      UPDATE player_bets SET status = 'lost', settled_at = NOW() WHERE id = v_pb.id;
    END IF;
  END LOOP;
END;
$$;

-- Player: place a bet (deducts bucks immediately)
CREATE OR REPLACE FUNCTION place_bet(
  p_prop_bet_id UUID,
  p_player_id   UUID,
  p_amount      INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prop     prop_bets%ROWTYPE;
  v_tourn    tournaments%ROWTYPE;
  v_balance  INTEGER;
  v_payout   INTEGER;
BEGIN
  SELECT * INTO v_prop FROM prop_bets WHERE id = p_prop_bet_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prop bet not found'; END IF;
  IF v_prop.status != 'open' THEN RAISE EXCEPTION 'Bet is closed'; END IF;

  SELECT * INTO v_tourn FROM tournaments WHERE id = v_prop.tournament_id;

  -- Lock on tournament day
  IF v_tourn.date IS NOT NULL AND v_tourn.date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'Bets are locked — tournament day has arrived';
  END IF;

  -- No self-betting on targeted props
  IF v_prop.target_player_id IS NOT NULL AND v_prop.target_player_id = p_player_id THEN
    RAISE EXCEPTION 'You cannot bet on yourself';
  END IF;

  IF p_amount < 50 THEN RAISE EXCEPTION 'Minimum bet is 50 bucks'; END IF;

  SELECT bagal_bucks INTO v_balance FROM players WHERE id = p_player_id;
  IF v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient bucks'; END IF;

  v_payout := FLOOR(p_amount * v_prop.odds);

  UPDATE players SET bagal_bucks = bagal_bucks - p_amount WHERE id = p_player_id;

  INSERT INTO bucks_transactions (player_id, amount, reason)
  VALUES (p_player_id, -p_amount, 'prop_bet:' || p_prop_bet_id);

  INSERT INTO player_bets (prop_bet_id, player_id, amount, potential_payout)
  VALUES (p_prop_bet_id, p_player_id, p_amount, v_payout)
  ON CONFLICT (prop_bet_id, player_id) DO NOTHING;
END;
$$;

-- System: settle all auto-resolvable open bets after scores are entered.
-- Manual types (hole_in_one, tilt, water_ball, etc.) are left open for admin
-- to resolve via mark_prop_result.
CREATE OR REPLACE FUNCTION settle_tournament_bets(p_tournament_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bet           prop_bets%ROWTYPE;
  v_pb            player_bets%ROWTYPE;
  v_winner_id     UUID;
  v_won           BOOLEAN;
  v_min_total     INTEGER;
  v_second_total  INTEGER;
  v_tie_count     INTEGER;
  v_any_pb        BOOLEAN;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;

  -- Winner = player with position 1
  SELECT player_id INTO v_winner_id
  FROM scores
  WHERE tournament_id = p_tournament_id AND position = 1
  LIMIT 1;

  -- Best (lowest) total score in this tournament
  SELECT MIN(total) INTO v_min_total
  FROM (
    SELECT SUM(gross_score) AS total
    FROM scores WHERE tournament_id = p_tournament_id
    GROUP BY player_id
  ) t;

  -- Second-best total (needed for margin + close_finish)
  SELECT MIN(total) INTO v_second_total
  FROM (
    SELECT SUM(gross_score) AS total
    FROM scores WHERE tournament_id = p_tournament_id
    GROUP BY player_id
  ) t
  WHERE total > v_min_total;

  -- How many players share the best total (tie detection)
  SELECT COUNT(*) INTO v_tie_count
  FROM (
    SELECT SUM(gross_score) AS total
    FROM scores WHERE tournament_id = p_tournament_id
    GROUP BY player_id
  ) t
  WHERE total = v_min_total;

  -- Personal best: any player (with prior history) beat their own best score
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT player_id, SUM(gross_score) AS this_total
      FROM scores WHERE tournament_id = p_tournament_id
      GROUP BY player_id
    ) cur
    WHERE EXISTS (
      -- player must have at least one prior tournament score
      SELECT 1 FROM scores s2
      WHERE s2.player_id = cur.player_id
        AND s2.tournament_id != p_tournament_id
    )
    AND cur.this_total < (
      SELECT MIN(prev_total)
      FROM (
        SELECT SUM(s2.gross_score) AS prev_total
        FROM scores s2
        WHERE s2.player_id = cur.player_id
          AND s2.tournament_id != p_tournament_id
        GROUP BY s2.tournament_id
      ) prev
    )
  ) INTO v_any_pb;

  -- Settle all auto-resolvable bets; manual types stay open for mark_prop_result
  FOR v_bet IN
    SELECT * FROM prop_bets
    WHERE tournament_id = p_tournament_id
      AND status = 'open'
      AND type NOT IN (
        'hole_in_one', 'tilt', 'water_ball', 'front_nine_choke',
        'duff_tee', 'birdie', 'multi_birdie', 'lost_balls', 'bunker_escape',
        'snowman', 'four_putt', 'three_putt_18', 'double_ob', 'blade_chip', 'skull_ob'
      )
  LOOP
    v_won := CASE v_bet.type
      WHEN 'winner' THEN
        v_bet.target_player_id IS NOT NULL AND v_bet.target_player_id = v_winner_id

      WHEN 'defend' THEN
        v_bet.target_player_id IS NOT NULL AND v_bet.target_player_id = v_winner_id

      WHEN 'personal_best' THEN
        COALESCE(v_any_pb, false)

      WHEN 'big_margin' THEN
        COALESCE(v_second_total - v_min_total, 0) >= 5

      WHEN 'tie_game' THEN
        v_tie_count > 1

      WHEN 'close_finish' THEN
        COALESCE(v_second_total - v_min_total, 999) <= 1

      ELSE false
    END;

    UPDATE prop_bets SET status = 'settled', result = v_won WHERE id = v_bet.id;

    FOR v_pb IN
      SELECT * FROM player_bets WHERE prop_bet_id = v_bet.id AND status = 'pending'
    LOOP
      IF v_won THEN
        UPDATE player_bets SET status = 'won', settled_at = NOW() WHERE id = v_pb.id;
        UPDATE players SET bagal_bucks = bagal_bucks + v_pb.potential_payout WHERE id = v_pb.player_id;
        INSERT INTO bucks_transactions (player_id, amount, reason)
        VALUES (v_pb.player_id, v_pb.potential_payout, 'prop_win:' || v_bet.id);
      ELSE
        UPDATE player_bets SET status = 'lost', settled_at = NOW() WHERE id = v_pb.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE prop_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_bets ENABLE ROW LEVEL SECURITY;

-- prop_bets: public read; admin full access
DROP POLICY IF EXISTS "prop_bets_select" ON prop_bets;
CREATE POLICY "prop_bets_select"  ON prop_bets FOR SELECT USING (true);
DROP POLICY IF EXISTS "prop_bets_admin" ON prop_bets;
CREATE POLICY "prop_bets_admin"   ON prop_bets FOR ALL    USING (is_admin());

-- player_bets: players see their own; admins see all; players insert their own
DROP POLICY IF EXISTS "player_bets_select" ON player_bets;
CREATE POLICY "player_bets_select" ON player_bets FOR SELECT
  USING (player_id = my_player_id() OR is_admin());
DROP POLICY IF EXISTS "player_bets_insert" ON player_bets;
CREATE POLICY "player_bets_insert" ON player_bets FOR INSERT
  WITH CHECK (player_id = my_player_id());
DROP POLICY IF EXISTS "player_bets_update" ON player_bets;
CREATE POLICY "player_bets_update" ON player_bets FOR UPDATE
  USING (is_admin());
