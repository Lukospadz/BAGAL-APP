-- Raise starting Bagal Bucks balance to 500 for all players

-- New players get 500 by default
ALTER TABLE players ALTER COLUMN bagal_bucks SET DEFAULT 500;

-- Grant 1000 to existing players with 0 balance
INSERT INTO bucks_transactions (player_id, amount, reason)
SELECT id, 500, 'starting_balance'
FROM players
WHERE bagal_bucks = 0;

UPDATE players SET bagal_bucks = 500 WHERE bagal_bucks = 0;
