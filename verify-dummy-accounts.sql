-- Verify existing dummy accounts yang belum ter-confirm

-- Option 1: Verify testuser1 dan testuser2 yang sudah ada
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email IN ('testuser1@example.com', 'testuser2@example.com')
AND email_confirmed_at IS NULL;

-- Check hasil verification
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Verified'
    ELSE '❌ Not Verified'
  END as status
FROM auth.users
WHERE email IN ('testuser1@example.com', 'testuser2@example.com');

-- Option 2: Jika ingin verify semua email @example.com
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email LIKE '%@example.com'
AND email_confirmed_at IS NULL;

-- Option 3: Verify specific email
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'testuser1@example.com';
