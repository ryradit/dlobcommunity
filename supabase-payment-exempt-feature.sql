-- =====================================================
-- PAYMENT EXEMPTION FEATURE
-- =====================================================
-- Purpose: Allow certain VIP/special members to play for free
-- Effect: Exempt members never pay anything and are excluded from payment recaps
-- Use case: Sponsors, admins, special guests (e.g., Ardo)

-- =====================================================
-- STEP 1: Add payment_exempt flag to profiles table
-- =====================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_payment_exempt BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_payment_exempt IS 
  'If true, this member never pays for matches (free access). Excluded from all payment calculations and recaps.';

-- =====================================================
-- STEP 2: Set Ardo as payment exempt
-- =====================================================
UPDATE public.profiles
SET is_payment_exempt = true
WHERE LOWER(full_name) = 'ardo';

-- Verify
SELECT id, full_name, is_payment_exempt 
FROM public.profiles 
WHERE is_payment_exempt = true;

-- =====================================================
-- STEP 3: Update existing Ardo match_members to 0 amounts
-- =====================================================
-- Set ALL of Ardo's matches to zero cost (regardless of payment status)
-- Note: total_amount is a GENERATED column, so we only update the base amounts
UPDATE public.match_members
SET 
  amount_due = 0,
  attendance_fee = 0
WHERE member_name ILIKE 'Ardo';

-- =====================================================
-- STEP 4: Helper function to check if member is exempt
-- =====================================================
CREATE OR REPLACE FUNCTION is_member_payment_exempt(p_member_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_exempt BOOLEAN;
BEGIN
  SELECT is_payment_exempt INTO v_is_exempt
  FROM public.profiles
  WHERE LOWER(full_name) = LOWER(TRIM(p_member_name))
  LIMIT 1;
  
  RETURN COALESCE(v_is_exempt, false);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_member_payment_exempt IS 
  'Check if a member is exempt from all payments. Returns true if member has is_payment_exempt flag.';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Check if a member is exempt:
-- SELECT is_member_payment_exempt('Ardo');
-- Returns: true

-- Get all exempt members:
-- SELECT id, full_name, created_at
-- FROM public.profiles
-- WHERE is_payment_exempt = true;

-- Get all non-exempt members with pending payments:
-- SELECT DISTINCT mm.member_name, COUNT(*) as pending_matches
-- FROM match_members mm
-- JOIN profiles p ON LOWER(p.full_name) = LOWER(mm.member_name)
-- WHERE mm.payment_status = 'pending'
--   AND p.is_payment_exempt = false
-- GROUP BY mm.member_name;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 
-- 1. Payment exempt members are automatically handled in bulk-create route
-- 2. All amounts set to 0: amount_due, attendance_fee, total_amount
-- 3. Exempt members are filtered out from:
--    - Admin payment lists
--    - Member dashboards  
--    - Payment recaps and summaries
--    - Total amount calculations
-- 4. This is permanent flag - use carefully
-- 5. To remove exemption: UPDATE profiles SET is_payment_exempt = false WHERE full_name = 'Name';
