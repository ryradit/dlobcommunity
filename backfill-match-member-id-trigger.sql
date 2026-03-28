-- ==============================================
-- FUTURE: Auto-populate member_id on match creation
-- ==============================================
-- Add a trigger that automatically sets member_id when a match is created

-- Create a function to find member_id from player name
CREATE OR REPLACE FUNCTION find_member_id_from_player_name(player_name TEXT)
RETURNS UUID AS $$
DECLARE
  found_user_id UUID;
BEGIN
  SELECT user_id INTO found_user_id
  FROM profiles
  WHERE 
    LOWER(TRIM(full_name)) = LOWER(TRIM(player_name))
    OR LOWER(TRIM(display_name)) = LOWER(TRIM(player_name))
    OR LOWER(TRIM(username)) = LOWER(TRIM(player_name))
  LIMIT 1;
  
  RETURN found_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to set member_id on INSERT/UPDATE
CREATE OR REPLACE FUNCTION set_match_member_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to find member_id from team1_player1 first, then team1_player2, etc.
  IF NEW.member_id IS NULL THEN
    NEW.member_id := find_member_id_from_player_name(NEW.team1_player1);
  END IF;
  
  IF NEW.member_id IS NULL THEN
    NEW.member_id := find_member_id_from_player_name(NEW.team1_player2);
  END IF;
  
  IF NEW.member_id IS NULL THEN
    NEW.member_id := find_member_id_from_player_name(NEW.team2_player1);
  END IF;
  
  IF NEW.member_id IS NULL THEN
    NEW.member_id := find_member_id_from_player_name(NEW.team2_player2);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on matches table
DROP TRIGGER IF EXISTS trigger_set_match_member_id ON matches;
CREATE TRIGGER trigger_set_match_member_id
BEFORE INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION set_match_member_id();

-- Test: View all matches and their member associations
SELECT 
  m.id,
  m.team1_player1,
  m.team1_player2,
  m.team2_player1,
  m.team2_player2,
  m.member_id,
  p.full_name as associated_member,
  m.created_at
FROM matches m
LEFT JOIN profiles p ON m.member_id = p.user_id
ORDER BY m.created_at DESC
LIMIT 20;
