-- ============================================================
-- DLOB Community: Complete Admin & Branch Roles Setup
-- ============================================================
-- Configuration Summary:
-- 1. Adit (ryradit@gmail.com)          -> role: 'admin', branch: 'dlob-pusat' (Owner / Super Admin, can switch branches)
-- 2. Wahyu (dlob.official.tng@gmail.com) -> role: 'admin', branch: 'dlob-cikupa' (Admin DLOB & Admin DLBC, can switch branches)
-- 3. Septian (septianrifalda@gmail.com) -> role: 'admin', branch: 'dlob-pusat' (Admin DLOB Pusat only)
-- 4. Danif (danif@temp.dlob.local)      -> role: 'admin', branch: 'dlob-pusat' (Admin DLOB Pusat only)
-- 5. Edi (edi@temp.dlob.local)          -> role: 'branch_admin', branch: 'dlob-cikupa' (Admin DLBC Cikupa only)
-- ============================================================

-- STEP 1: Reset any other accounts that accidentally got admin/branch_admin back to member
UPDATE profiles
SET
  role = 'member',
  branch_id = 'dlob-pusat',
  updated_at = NOW()
WHERE
  role IN ('admin', 'branch_admin')
  AND email NOT IN (
    'ryradit@gmail.com',
    'dlob.official.tng@gmail.com',
    'septianrifalda@gmail.com',
    'danif@temp.dlob.local',
    'edi@temp.dlob.local'
  );

-- STEP 2: Configure DLOB Pusat Admins (Adit, Septian, Danif)
UPDATE profiles
SET
  role = 'admin',
  branch_id = 'dlob-pusat',
  updated_at = NOW()
WHERE email IN (
  'ryradit@gmail.com',
  'septianrifalda@gmail.com',
  'danif@temp.dlob.local'
);

-- STEP 3: Configure Dual Admin (Wahyu: Admin DLOB & DLBC, can switch branches)
UPDATE profiles
SET
  role = 'admin',
  branch_id = 'dlob-cikupa',
  updated_at = NOW()
WHERE email = 'dlob.official.tng@gmail.com';

-- STEP 4: Configure DLBC Cikupa Admin (Edi: DLBC only)
UPDATE profiles
SET
  role = 'branch_admin',
  branch_id = 'dlob-cikupa',
  updated_at = NOW()
WHERE email = 'edi@temp.dlob.local';

-- STEP 5: Verification Query
SELECT id, full_name, email, role, branch_id, updated_at
FROM profiles
WHERE email IN (
  'ryradit@gmail.com',
  'dlob.official.tng@gmail.com',
  'septianrifalda@gmail.com',
  'danif@temp.dlob.local',
  'edi@temp.dlob.local'
)
ORDER BY
  CASE
    WHEN email = 'ryradit@gmail.com' THEN 1
    WHEN email = 'dlob.official.tng@gmail.com' THEN 2
    WHEN email = 'septianrifalda@gmail.com' THEN 3
    WHEN email = 'danif@temp.dlob.local' THEN 4
    WHEN email = 'edi@temp.dlob.local' THEN 5
    ELSE 6
  END;
