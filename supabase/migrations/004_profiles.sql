-- 004_profiles.sql
-- Favourite courses + course photo storage

-- ─── 1. Favourite courses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourite_courses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rank       INT  NOT NULL CHECK (rank BETWEEN 1 AND 4),
  name       TEXT NOT NULL,
  photo_url  TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, rank)
);

ALTER TABLE favourite_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "fav_courses_public_read" ON favourite_courses
  FOR SELECT USING (true);

-- Owner can manage their own
CREATE POLICY "fav_courses_owner_insert" ON favourite_courses
  FOR INSERT WITH CHECK (player_id = my_player_id());

CREATE POLICY "fav_courses_owner_update" ON favourite_courses
  FOR UPDATE USING (player_id = my_player_id());

CREATE POLICY "fav_courses_owner_delete" ON favourite_courses
  FOR DELETE USING (player_id = my_player_id());

-- ─── 2. Storage bucket for course photos ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-photos', 'course-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view photos (bucket is public but we add policy too)
CREATE POLICY "course_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-photos');

-- Authenticated users can upload their own photos
CREATE POLICY "course_photos_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-photos'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can update/delete their own uploads
CREATE POLICY "course_photos_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'course-photos'
    AND owner = auth.uid()
  );

CREATE POLICY "course_photos_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-photos'
    AND owner = auth.uid()
  );
