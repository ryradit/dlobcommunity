-- =====================================================
-- TEST LABEL FEATURE
-- =====================================================
-- Purpose: Allow admins to mark certain accounts as "Test" (akun tes)
-- Use case: Dummy accounts used for testing features

-- =====================================================
-- STEP 1: Add is_test_account flag to profiles table
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_test_account IS
  'If true, this account is marked as a test/dummy account by an admin. Only visible in admin panel.';

-- Verify
SELECT id, full_name, is_test_account
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;
