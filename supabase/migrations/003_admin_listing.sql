-- 003_admin_listing.sql
-- Allow admins to see all profiles with email addresses, and link them to players

-- Returns all profiles joined with their email from auth.users (admin only)
CREATE OR REPLACE FUNCTION admin_list_profiles()
RETURNS TABLE(
  id         UUID,
  email      TEXT,
  role       TEXT,
  player_id  UUID,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT p.id, u.email::TEXT, p.role, p.player_id, p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
