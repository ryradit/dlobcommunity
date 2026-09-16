-- ============================================================
-- SUPER ADMIN CLEANUP: Adit (ryradit@gmail.com) ONLY
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Preview all current admins in the database
-- ─────────────────────────────────────────────────────────────
SELECT id, full_name, email, role, branch_id
FROM profiles
WHERE role IN ('admin', 'branch_admin')
ORDER BY role, full_name;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Demote ANY user who has role = 'admin' but is NOT Adit
--         (They will be set back to role = 'member')
-- ─────────────────────────────────────────────────────────────
UPDATE profiles
SET
  role = 'member',
  updated_at = NOW()
WHERE
  role = 'admin'
  AND email NOT ILIKE '%ryradit%';

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Guarantee Adit is Super Admin with DLOB Pusat branch
-- ─────────────────────────────────────────────────────────────
UPDATE profiles
SET
  role = 'admin',
  branch_id = 'dlob-pusat',
  updated_at = NOW()
WHERE
  email = 'ryradit@gmail.com'
  OR email ILIKE '%ryradit%';

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Verify the result
--         - Super Admin: ONLY Adit (ryradit@gmail.com)
--         - DLBC Admin: ONLY Edi & Wahyu
-- ─────────────────────────────────────────────────────────────
SELECT id, full_name, email, role, branch_id
FROM profiles
WHERE role IN ('admin', 'branch_admin')
ORDER BY role, full_name;
