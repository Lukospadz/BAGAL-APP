-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── players ──────────────────────────────────────────────────────────────────
CREATE TABLE players (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  initials     TEXT        NOT NULL CHECK (char_length(initials) BETWEEN 1 AND 3),
  color        TEXT        NOT NULL DEFAULT '#185FA5',
  handicap     NUMERIC(4,1),
  avatar_url   TEXT,
  bio          TEXT,
  home_course  TEXT,
  bag          JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Automatically created via trigger when a user signs up.
-- role is NEVER set by client code; only via the admin SQL bootstrap snippet.
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'player'
                          CHECK (role IN ('admin', 'player')),
  player_id   UUID        REFERENCES players(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── seasons ──────────────────────────────────────────────────────────────────
CREATE TABLE seasons (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  year                SMALLINT    NOT NULL,
  start_date          DATE,
  end_date            DATE,
  status              TEXT        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'completed')),
  champion_player_id  UUID        REFERENCES players(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── tournaments ──────────────────────────────────────────────────────────────
CREATE TABLE tournaments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     UUID        NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  date          DATE,
  course        TEXT,
  course_rating SMALLINT    CHECK (course_rating BETWEEN 1 AND 5),
  format        TEXT        NOT NULL DEFAULT 'stroke'
                            CHECK (format IN ('stroke', 'match', 'scramble')),
  par           SMALLINT,
  holes         SMALLINT    NOT NULL DEFAULT 18 CHECK (holes IN (9, 18)),
  rounds        SMALLINT    NOT NULL DEFAULT 1 CHECK (rounds IN (1, 4)),
  status        TEXT        NOT NULL DEFAULT 'upcoming'
                            CHECK (status IN ('upcoming', 'completed')),
  points_1st    SMALLINT    NOT NULL DEFAULT 0,
  points_2nd    SMALLINT    NOT NULL DEFAULT 0,
  points_3rd    SMALLINT    NOT NULL DEFAULT 0,
  sort_order    SMALLINT    NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── scores ───────────────────────────────────────────────────────────────────
CREATE TABLE scores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id       UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number    SMALLINT    NOT NULL DEFAULT 1,
  gross_score     INTEGER     NOT NULL CHECK (gross_score > 0),
  position        SMALLINT,
  points_awarded  SMALLINT    NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, player_id, round_number)
);

-- ─── casual_rounds ────────────────────────────────────────────────────────────
CREATE TABLE casual_rounds (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id         UUID        NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  date              DATE        NOT NULL,
  course            TEXT,
  winner_player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  points_awarded    SMALLINT    NOT NULL DEFAULT 5,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── personal_rounds ──────────────────────────────────────────────────────────
CREATE TABLE personal_rounds (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  date           DATE        NOT NULL,
  course         TEXT        NOT NULL,
  course_rating  SMALLINT    CHECK (course_rating BETWEEN 1 AND 5),
  score          INTEGER,
  par            SMALLINT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX ON tournaments (season_id, sort_order);
CREATE INDEX ON scores (tournament_id);
CREATE INDEX ON scores (player_id);
CREATE INDEX ON casual_rounds (season_id);
CREATE INDEX ON casual_rounds (winner_player_id);
CREATE INDEX ON personal_rounds (player_id, date DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_rounds  ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rounds ENABLE ROW LEVEL SECURITY;

-- Admin helper — SECURITY DEFINER avoids infinite recursion when reading profiles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper: return the player_id linked to the current user
CREATE OR REPLACE FUNCTION my_player_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT player_id FROM profiles WHERE id = auth.uid();
$$;

-- profiles policies
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    (is_admin() OR role = (SELECT role FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- players: world-readable; admin can write all; player can update their own row
CREATE POLICY "players_public_read" ON players
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "players_admin_write" ON players
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "players_self_update" ON players
  FOR UPDATE TO authenticated
  USING (id = my_player_id())
  WITH CHECK (id = my_player_id());

-- seasons: world-readable, admin-writable
CREATE POLICY "seasons_public_read" ON seasons
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "seasons_admin_write" ON seasons
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- tournaments: world-readable, admin-writable
CREATE POLICY "tournaments_public_read" ON tournaments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tournaments_admin_write" ON tournaments
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- scores: world-readable, admin-writable
CREATE POLICY "scores_public_read" ON scores
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "scores_admin_write" ON scores
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- casual_rounds: world-readable, admin-writable
CREATE POLICY "casual_public_read" ON casual_rounds
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "casual_admin_write" ON casual_rounds
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- personal_rounds: world-readable; each player manages their own
CREATE POLICY "personal_public_read" ON personal_rounds
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "personal_self_write" ON personal_rounds
  FOR ALL TO authenticated
  USING (player_id = my_player_id())
  WITH CHECK (player_id = my_player_id());

CREATE POLICY "personal_admin_all" ON personal_rounds
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ─── Auto-create profile on first sign-in ─────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, 'player')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- ADMIN BOOTSTRAP (run once in Supabase SQL editor after your first sign-in)
-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
