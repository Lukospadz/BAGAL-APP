-- 005: change sub-90 bucks award to "under 20 over par" award
CREATE OR REPLACE FUNCTION handle_personal_round_bucks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.score IS NOT NULL
     AND NEW.par   IS NOT NULL
     AND NEW.score < NEW.par + 20 THEN
    UPDATE players SET bagal_bucks = bagal_bucks + 150 WHERE id = NEW.player_id;
    INSERT INTO bucks_transactions (player_id, amount, reason)
    VALUES (NEW.player_id, 150, 'personal_round:under_20_over');
  END IF;
  RETURN NEW;
END;
$$;
