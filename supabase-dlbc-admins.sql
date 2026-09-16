-- ============================================================
-- DLBC Admin Cleanup & Exact Assignment: Edi & Wahyu ONLY
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Revert all unintended branch_admin accounts back to
--         role = 'member' and branch_id = 'dlob-pusat'
-- ─────────────────────────────────────────────────────────────
UPDATE profiles
SET
  role = 'member',
  branch_id = 'dlob-pusat',
  updated_at = NOW()
WHERE
  role = 'branch_admin'
  AND email NOT IN (
    'edi@temp.dlob.local',
    'dlob.official.tng@gmail.com'
  );

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Ensure ONLY Edi and Wahyu are DLBC branch_admins
-- ─────────────────────────────────────────────────────────────
UPDATE profiles
SET
  role = 'branch_admin',
  branch_id = 'dlob-cikupa',
  updated_at = NOW()
WHERE email IN (
  'edi@temp.dlob.local',
  'dlob.official.tng@gmail.com'
);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Verify the result — only 2 rows should appear now
-- ─────────────────────────────────────────────────────────────
SELECT id, full_name, email, role, branch_id
FROM profiles
WHERE role = 'branch_admin' OR branch_id = 'dlob-cikupa';
