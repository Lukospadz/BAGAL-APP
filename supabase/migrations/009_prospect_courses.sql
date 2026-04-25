-- Shared group wishlist of courses to play
CREATE TABLE IF NOT EXISTS prospect_courses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  location   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prospect_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_public_read" ON prospect_courses
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "prospect_owner_insert" ON prospect_courses
  FOR INSERT TO authenticated
  WITH CHECK (player_id = my_player_id());

CREATE POLICY "prospect_owner_delete" ON prospect_courses
  FOR DELETE TO authenticated
  USING (player_id = my_player_id() OR is_admin());
