-- Add member_id column to matches table to link matches to users
ALTER TABLE matches
ADD COLUMN member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_matches_member_id ON matches(member_id);

-- ==============================================
-- BACKFILL: Map existing player names to member_id
-- ==============================================

-- For now, leave member_id NULL on existing matches
-- (will be populated when user selects their match name in coaching chat)

-- Verify backfill
SELECT 
  COUNT(*) as total_matches,
  COUNT(CASE WHEN member_id IS NOT NULL THEN 1 END) as linked_matches,
  COUNT(CASE WHEN member_id IS NULL THEN 1 END) as unlinked_matches
FROM matches;
