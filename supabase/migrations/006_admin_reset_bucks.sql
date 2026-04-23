-- 006: admin can wipe a player's BAGAL Bucks, shop items, and transactions.
CREATE OR REPLACE FUNCTION admin_reset_player_bucks(p_player_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE players
     SET bagal_bucks  = 0,
         active_title = NULL,
         active_frame = NULL
   WHERE id = p_player_id;

  DELETE FROM player_items       WHERE player_id = p_player_id;
  DELETE FROM bucks_transactions WHERE player_id = p_player_id;
END;
$$;
