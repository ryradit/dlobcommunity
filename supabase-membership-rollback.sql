-- =====================================================
-- MEMBERSHIP ROLLBACK FEATURE
-- =====================================================
-- Purpose: Allow admin to revoke/cancel a member's membership
-- Effect: Member returns to non-membership status and must pay attendance fees again
-- Attendance fee: Rp 18,000 once per day (for pending unpaid matches)

-- =====================================================
-- FUNCTION: Rollback membership and recalculate fees
-- =====================================================
CREATE OR REPLACE FUNCTION rollback_membership(
  p_membership_id UUID
)
RETURNS TABLE(
  deleted_membership BOOLEAN,
  updated_match_records INTEGER,
  member_name TEXT,
  month INTEGER,
  year INTEGER
) AS $$
DECLARE
  v_member_name TEXT;
  v_month INTEGER;
  v_year INTEGER;
  v_updated_count INTEGER := 0;
  v_attendance_fee INTEGER := 18000;
BEGIN
  -- Get membership details before deletion
  SELECT m.member_name, m.month, m.year
  INTO v_member_name, v_month, v_year
  FROM public.memberships m
  WHERE m.id = p_membership_id;
  
  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Membership not found with id: %', p_membership_id;
  END IF;
  
  RAISE NOTICE 'Rolling back membership for: % (Month: %, Year: %)', v_member_name, v_month, v_year;
  
  -- Update all PENDING match_members records for this member
  -- Set has_membership = false and recalculate attendance_fee
  WITH match_dates AS (
    SELECT DISTINCT 
      m.id as match_id,
      DATE(m.match_date) as match_date
    FROM public.matches m
    JOIN public.match_members mm ON mm.match_id = m.id
    WHERE mm.member_name = v_member_name
      AND mm.payment_status = 'pending'
      AND EXTRACT(MONTH FROM m.match_date) = v_month
      AND EXTRACT(YEAR FROM m.match_date) = v_year
  ),
  first_match_per_day AS (
    -- For each day, find the first match (lowest match_number)
    SELECT DISTINCT ON (DATE(m.match_date))
      mm.id as match_member_id,
      DATE(m.match_date) as match_date,
      m.match_number
    FROM public.matches m
    JOIN public.match_members mm ON mm.match_id = m.id
    WHERE mm.member_name = v_member_name
      AND mm.payment_status = 'pending'
      AND EXTRACT(MONTH FROM m.match_date) = v_month
      AND EXTRACT(YEAR FROM m.match_date) = v_year
    ORDER BY DATE(m.match_date), m.match_number ASC
  )
  UPDATE public.match_members mm
  SET 
    has_membership = false,
    attendance_fee = CASE 
      -- First match of each day gets attendance fee
      WHEN mm.id IN (SELECT match_member_id FROM first_match_per_day) THEN v_attendance_fee
      -- Subsequent matches on same day don't get charged again
      ELSE 0
    END,
    attendance_paid_this_entry = CASE 
      WHEN mm.id IN (SELECT match_member_id FROM first_match_per_day) THEN true
      ELSE false
    END,
    total_amount = mm.amount_due + CASE 
      WHEN mm.id IN (SELECT match_member_id FROM first_match_per_day) THEN v_attendance_fee
      ELSE 0
    END
  WHERE mm.member_name = v_member_name
    AND mm.payment_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = mm.match_id
        AND EXTRACT(MONTH FROM m.match_date) = v_month
        AND EXTRACT(YEAR FROM m.match_date) = v_year
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Updated % match records with attendance fees', v_updated_count;
  
  -- Delete the membership record
  DELETE FROM public.memberships
  WHERE id = p_membership_id;
  
  RAISE NOTICE 'Membership deleted successfully';
  
  -- Return summary
  RETURN QUERY SELECT 
    true as deleted_membership,
    v_updated_count as updated_match_records,
    v_member_name as member_name,
    v_month as month,
    v_year as year;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rollback_membership IS 
  'Rollback/cancel membership and recalculate attendance fees for pending matches. Member returns to non-membership status.';

-- =====================================================
-- PREVIEW FUNCTION: Check what will be affected
-- =====================================================
CREATE OR REPLACE FUNCTION preview_membership_rollback(
  p_membership_id UUID
)
RETURNS TABLE(
  member_name TEXT,
  month INTEGER,
  year INTEGER,
  total_pending_matches BIGINT,
  matches_will_get_attendance_fee INTEGER,
  total_attendance_fees_to_add BIGINT
) AS $$
DECLARE
  v_member_name TEXT;
  v_month INTEGER;
  v_year INTEGER;
  v_pending_count BIGINT;
  v_attendance_days INTEGER;
  v_total_fees BIGINT;
BEGIN
  -- Get membership details
  SELECT m.member_name, m.month, m.year
  INTO v_member_name, v_month, v_year
  FROM public.memberships m
  WHERE m.id = p_membership_id;
  
  IF v_member_name IS NULL THEN
    RAISE EXCEPTION 'Membership not found with id: %', p_membership_id;
  END IF;
  
  -- Count total pending matches
  SELECT COUNT(*)
  INTO v_pending_count
  FROM public.match_members mm
  JOIN public.matches m ON m.id = mm.match_id
  WHERE mm.member_name = v_member_name
    AND mm.payment_status = 'pending'
    AND EXTRACT(MONTH FROM m.match_date) = v_month
    AND EXTRACT(YEAR FROM m.match_date) = v_year;
  
  -- Count distinct days (each day = one attendance fee)
  SELECT COUNT(DISTINCT DATE(m.match_date))
  INTO v_attendance_days
  FROM public.match_members mm
  JOIN public.matches m ON m.id = mm.match_id
  WHERE mm.member_name = v_member_name
    AND mm.payment_status = 'pending'
    AND EXTRACT(MONTH FROM m.match_date) = v_month
    AND EXTRACT(YEAR FROM m.match_date) = v_year;
  
  v_total_fees := v_attendance_days * 18000;
  
  RETURN QUERY SELECT 
    v_member_name,
    v_month,
    v_year,
    v_pending_count,
    v_attendance_days,
    v_total_fees;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION preview_membership_rollback IS 
  'Preview what will happen before rolling back membership. Shows how many matches will be affected.';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Preview what will be affected before rollback:
-- SELECT * FROM preview_membership_rollback('[membership-uuid]');
-- Returns: member_name, month, year, total_pending_matches, matches_will_get_attendance_fee, total_attendance_fees_to_add

-- Example output:
-- member_name | month | year | total_pending_matches | matches_will_get_attendance_fee | total_attendance_fees_to_add
-- Adit        | 2     | 2026 | 5                     | 2                               | 36000
-- ^ Means: Adit has 5 pending matches across 2 Saturdays, will add Rp 36,000 in attendance fees

-- Execute rollback:
-- SELECT * FROM rollback_membership('[membership-uuid]');
-- Returns: deleted_membership, updated_match_records, member_name, month, year

-- Check member's updated records after rollback:
-- SELECT 
--   mm.member_name,
--   m.match_date,
--   mm.amount_due as shuttlecock,
--   mm.attendance_fee,
--   mm.total_amount,
--   mm.payment_status,
--   mm.has_membership
-- FROM match_members mm
-- JOIN matches m ON m.id = mm.match_id
-- WHERE mm.member_name = 'Adit'
--   AND EXTRACT(MONTH FROM m.match_date) = 2
--   AND EXTRACT(YEAR FROM m.match_date) = 2026
-- ORDER BY m.match_date, m.match_number;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 
-- 1. Only affects PENDING matches (not paid/cancelled/revision)
-- 2. Attendance fee applied once per day (first match of each Saturday)
-- 3. Subsequent matches on same day get attendance_fee = 0
-- 4. Total amounts recalculated: total_amount = shuttlecock + attendance_fee
-- 5. The membership record is permanently deleted
-- 6. Member can purchase membership again later if needed
