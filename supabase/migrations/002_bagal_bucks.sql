-- 002_bagal_bucks.sql
-- BAGAL Bucks currency, shop items, animated frames, and personal round tracking

-- 1. Extend players with bucks + equipped cosmetics
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS bagal_bucks  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_title TEXT,
  ADD COLUMN IF NOT EXISTS active_frame TEXT;

-- 2. Tournaments track whether bucks have been awarded (idempotency)
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS bucks_awarded BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Bucks transaction log (earn / spend history)
CREATE TABLE IF NOT EXISTS bucks_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount     INTEGER     NOT NULL,          -- positive = earn, negative = spend
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bucks_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read bucks_transactions" ON bucks_transactions;
CREATE POLICY "public read bucks_transactions"
  ON bucks_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manage bucks_transactions" ON bucks_transactions;
CREATE POLICY "admin manage bucks_transactions"
  ON bucks_transactions FOR ALL USING (is_admin());

-- 4. Player-owned shop items
CREATE TABLE IF NOT EXISTS player_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id      TEXT        NOT NULL,
  item_type    TEXT        NOT NULL CHECK (item_type IN ('title','frame')),
  item_name    TEXT        NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, item_id)
);

ALTER TABLE player_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read player_items" ON player_items;
CREATE POLICY "public read player_items"
  ON player_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin manage player_items" ON player_items;
CREATE POLICY "admin manage player_items"
  ON player_items FOR ALL USING (is_admin());

-- players can insert their own items (via buy_shop_item which is SECURITY DEFINER)
-- but we also allow direct insert as a fallback
DROP POLICY IF EXISTS "players buy items" ON player_items;
CREATE POLICY "players buy items"
  ON player_items FOR INSERT
  WITH CHECK (player_id = my_player_id());

-- 5. Ensure personal_rounds allows player inserts (may already exist)
DROP POLICY IF EXISTS "players insert own rounds" ON personal_rounds;
CREATE POLICY "players insert own rounds"
  ON personal_rounds FOR INSERT
  WITH CHECK (player_id = my_player_id());

DROP POLICY IF EXISTS "players update own rounds" ON personal_rounds;
CREATE POLICY "players update own rounds"
  ON personal_rounds FOR UPDATE
  USING (player_id = my_player_id());

DROP POLICY IF EXISTS "players delete own rounds" ON personal_rounds;
CREATE POLICY "players delete own rounds"
  ON personal_rounds FOR DELETE
  USING (player_id = my_player_id());

-- 6. Atomic shop purchase function
CREATE OR REPLACE FUNCTION buy_shop_item(
  p_item_id   TEXT,
  p_item_type TEXT,
  p_item_name TEXT,
  p_price     INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_bucks     INTEGER;
BEGIN
  v_player_id := my_player_id();
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated as a player';
  END IF;

  SELECT bagal_bucks INTO v_bucks FROM players WHERE id = v_player_id;
  IF v_bucks < p_price THEN
    RAISE EXCEPTION 'Insufficient BAGAL Bucks — need %, have %', p_price, v_bucks;
  END IF;

  IF EXISTS (SELECT 1 FROM player_items WHERE player_id = v_player_id AND item_id = p_item_id) THEN
    RAISE EXCEPTION 'Already owned';
  END IF;

  UPDATE players SET bagal_bucks = bagal_bucks - p_price WHERE id = v_player_id;

  INSERT INTO bucks_transactions (player_id, amount, reason)
  VALUES (v_player_id, -p_price, 'shop:' || p_item_name);

  INSERT INTO player_items (player_id, item_id, item_type, item_name)
  VALUES (v_player_id, p_item_id, p_item_type, p_item_name);
END;
$$;

-- 7. Equip / unequip cosmetics
CREATE OR REPLACE FUNCTION equip_item(p_item_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
  v_type      TEXT;
  v_name      TEXT;
BEGIN
  v_player_id := my_player_id();
  IF v_player_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT item_type, item_name INTO v_type, v_name
  FROM player_items
  WHERE player_id = v_player_id AND item_id = p_item_id;

  IF v_type IS NULL THEN RAISE EXCEPTION 'Item not owned'; END IF;

  IF v_type = 'title' THEN
    UPDATE players SET active_title = v_name WHERE id = v_player_id;
  ELSE
    UPDATE players SET active_frame = p_item_id WHERE id = v_player_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION unequip_item(p_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_id UUID;
BEGIN
  v_player_id := my_player_id();
  IF v_player_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF p_type = 'title' THEN
    UPDATE players SET active_title = NULL WHERE id = v_player_id;
  ELSE
    UPDATE players SET active_frame = NULL WHERE id = v_player_id;
  END IF;
END;
$$;

-- 8. Award tournament bucks (admin calls after entering scores — idempotent)
CREATE OR REPLACE FUNCTION award_tournament_bucks(p_tournament_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec      RECORD;
  v_amount INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM tournaments WHERE id = p_tournament_id AND bucks_awarded = TRUE) THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT DISTINCT ON (player_id) player_id, position
    FROM scores
    WHERE tournament_id = p_tournament_id AND round_number = 1
    ORDER BY player_id, round_number
  LOOP
    v_amount := CASE rec.position
      WHEN 1 THEN 500
      WHEN 2 THEN 300
      WHEN 3 THEN 100
      ELSE 25
    END;

    UPDATE players SET bagal_bucks = bagal_bucks + v_amount WHERE id = rec.player_id;
    INSERT INTO bucks_transactions (player_id, amount, reason)
    VALUES (rec.player_id, v_amount, 'tournament_finish:' || rec.position || ':' || p_tournament_id);
  END LOOP;

  UPDATE tournaments SET bucks_awarded = TRUE WHERE id = p_tournament_id;
END;
$$;

-- 9. Trigger: award 150 bucks when a player logs a sub-90 personal round
CREATE OR REPLACE FUNCTION handle_personal_round_bucks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.score IS NOT NULL AND NEW.score < 90 THEN
    UPDATE players SET bagal_bucks = bagal_bucks + 150 WHERE id = NEW.player_id;
    INSERT INTO bucks_transactions (player_id, amount, reason)
    VALUES (NEW.player_id, 150, 'personal_round:sub90');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_personal_round_insert ON personal_rounds;
CREATE TRIGGER on_personal_round_insert
  AFTER INSERT ON personal_rounds
  FOR EACH ROW EXECUTE FUNCTION handle_personal_round_bucks();
