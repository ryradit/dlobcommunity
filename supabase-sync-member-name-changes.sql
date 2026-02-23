-- =====================================================
-- AUTO-SYNC MEMBER NAME CHANGES
-- =====================================================
-- Purpose: When a member changes their name in profiles table,
--          automatically update all related records in:
--          - match_members
--          - memberships
--          - any other tables using member_name
--
-- This prevents the bug where changing name causes match history to disappear

-- =====================================================
-- TRIGGER FUNCTION: Sync name changes across all tables
-- =====================================================
CREATE OR REPLACE FUNCTION sync_member_name_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the full_name actually changed
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    
    RAISE NOTICE 'Syncing name change: % -> %', OLD.full_name, NEW.full_name;
    
    -- Update match_members table
    UPDATE public.match_members
    SET member_name = NEW.full_name
    WHERE member_name = OLD.full_name;
    
    RAISE NOTICE 'Updated % match_members records', FOUND;
    
    -- Update memberships table
    UPDATE public.memberships
    SET member_name = NEW.full_name
    WHERE member_name = OLD.full_name;
    
    RAISE NOTICE 'Updated % memberships records', FOUND;
    
    -- Add more tables here if needed in the future
    -- Example:
    -- UPDATE public.some_other_table
    -- SET member_name = NEW.full_name
    -- WHERE member_name = OLD.full_name;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_member_name_changes IS 
  'Automatically updates member_name in match_members and memberships when profile full_name changes';

-- =====================================================
-- CREATE TRIGGER on profiles table
-- =====================================================
DROP TRIGGER IF EXISTS trigger_sync_member_name ON public.profiles;

CREATE TRIGGER trigger_sync_member_name
  AFTER UPDATE OF full_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_member_name_changes();

COMMENT ON TRIGGER trigger_sync_member_name ON public.profiles IS 
  'Syncs member name changes to match_members and memberships tables';

-- =====================================================
-- ONE-TIME FIX: Manual sync function (if needed)
-- =====================================================
-- Use this function if you need to manually fix orphaned records
-- Example: SELECT sync_member_name_manual('Ryan Radityatama', 'Adit');

CREATE OR REPLACE FUNCTION sync_member_name_manual(
  p_old_name TEXT,
  p_new_name TEXT
)
RETURNS TABLE(
  match_members_updated BIGINT,
  memberships_updated BIGINT
) AS $$
DECLARE
  v_match_count BIGINT;
  v_membership_count BIGINT;
BEGIN
  -- Update match_members
  UPDATE public.match_members
  SET member_name = p_new_name
  WHERE member_name = p_old_name;
  
  GET DIAGNOSTICS v_match_count = ROW_COUNT;
  
  -- Update memberships
  UPDATE public.memberships
  SET member_name = p_new_name
  WHERE member_name = p_old_name;
  
  GET DIAGNOSTICS v_membership_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_match_count, v_membership_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_member_name_manual IS 
  'Manually sync member name from old to new across all tables. Usage: SELECT * FROM sync_member_name_manual(''OldName'', ''NewName'')';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Automatic sync (happens automatically when profile name changes):
-- UPDATE profiles SET full_name = 'Adit' WHERE full_name = 'Ryan Radityatama';
-- → Trigger fires automatically and updates match_members + memberships

-- Manual fix for existing orphaned data:
-- SELECT * FROM sync_member_name_manual('Ryan Radityatama', 'Adit');
-- Returns: (match_members_updated, memberships_updated)

-- Check what would be affected before manual sync:
-- SELECT COUNT(*) FROM match_members WHERE member_name = 'Ryan Radityatama';
-- SELECT COUNT(*) FROM memberships WHERE member_name = 'Ryan Radityatama';
