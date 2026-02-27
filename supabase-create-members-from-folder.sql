-- Create Member Accounts from Members Folder
-- This script creates accounts for all members based on their image filenames
-- Members will use temporary credentials and must update email/password on first login

-- INSTRUCTIONS:
-- 1. This script creates accounts with pattern: [name]@temp.dlob.local
-- 2. All accounts use template password: DLOB2026
-- 3. Members must update email and password on first login
-- 4. Run this in Supabase SQL Editor

-- Step 1: Add required columns to profiles table for first-login flow
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS using_temp_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_temp_email ON profiles(using_temp_email);

-- Step 3: Member data extracted from public/images/members/ folder
-- Format: (username, full_name, temp_email, temp_password)
-- Note: These will be created manually since Supabase doesn't allow direct auth.users INSERT via SQL

-- List of members from folder:
DO $$
DECLARE
    member_list TEXT[] := ARRAY[
        'abdul', 'adi', 'adit', 'alex', 'anthony', 'ardo', 'aren', 'arifin',
        'bagas', 'bibit', 'danif', 'dedi', 'dimas', 'dinda', 'edi', 'eka',
        'fanis', 'ganex', 'gavin', 'hendi', 'herdan', 'herry', 'iyan', 'jonathan',
        'kiki', 'lorenzo', 'mario', 'murdi', 'northon', 'rara', 'reyza', 'tian2',
        'uti', 'wahyu', 'wien', 'wiwin', 'yaya', 'yogie', 'zaka'
    ];
    member_name TEXT;
    temp_email TEXT;
    display_name TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DLOB MEMBER ACCOUNT CREATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total members to create: %', array_length(member_list, 1);
    RAISE NOTICE 'Template password for all: DLOB2026';
    RAISE NOTICE '';
    RAISE NOTICE 'Member List:';
    RAISE NOTICE '----------------------------------------';
    
    FOREACH member_name IN ARRAY member_list
    LOOP
        temp_email := member_name || '@temp.dlob.local';
        display_name := initcap(member_name);
        
        RAISE NOTICE 'Username: % | Email: % | Name: %', 
            member_name, temp_email, display_name;
    END LOOP;
    
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Copy the output above';
    RAISE NOTICE '2. Run the Node.js script to create auth.users';
    RAISE NOTICE '3. Or use the admin API endpoint';
    RAISE NOTICE '';
END $$;

-- Step 4: Export as JSON for API usage
SELECT json_agg(
    json_build_object(
        'username', member_name,
        'full_name', initcap(member_name),
        'email', member_name || '@temp.dlob.local',
        'avatar_url', '/images/members/' || member_name || '.jpg',
        'using_temp_email', true,
        'must_change_password', true,
        'role', 'member'
    )
)::text as members_json
FROM unnest(ARRAY[
    'abdul', 'adi', 'adit', 'alex', 'anthony', 'ardo', 'aren', 'arifin',
    'bagas', 'bibit', 'danif', 'dedi', 'dimas', 'dinda', 'edi', 'eka',
    'fanis', 'ganex', 'gavin', 'hendi', 'herdan', 'herry', 'iyan', 'jonathan',
    'kiki', 'lorenzo', 'mario', 'murdi', 'northon', 'rara', 'reyza', 'tian2',
    'uti', 'wahyu', 'wien', 'wiwin', 'yaya', 'yogie', 'zaka'
]) AS member_name;

-- Step 5: After auth.users are created via API, run this to ensure profiles exist
-- This is a backup - the trigger should handle it automatically
CREATE OR REPLACE FUNCTION create_member_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    member_record RECORD;
    user_id UUID;
BEGIN
    RAISE NOTICE 'Creating/updating profiles for members...';
    
    FOR member_record IN 
        SELECT 
            u.id,
            u.email,
            u.raw_user_meta_data->>'full_name' as full_name,
            u.raw_user_meta_data->>'avatar_url' as avatar_url
        FROM auth.users u
        WHERE u.email LIKE '%@temp.dlob.local'
    LOOP
        -- Extract username from email
        DECLARE
            username TEXT := split_part(member_record.email, '@', 1);
        BEGIN
            INSERT INTO profiles (
                id,
                full_name,
                email,
                avatar_url,
                role,
                is_active,
                using_temp_email,
                must_change_password
            ) VALUES (
                member_record.id,
                COALESCE(member_record.full_name, initcap(username)),
                member_record.email,
                COALESCE(member_record.avatar_url, '/images/members/' || username || '.jpg'),
                'member',
                true,
                true,
                true
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
                avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
                using_temp_email = EXCLUDED.using_temp_email,
                must_change_password = EXCLUDED.must_change_password;
            
            RAISE NOTICE '✓ Profile created/updated for: %', username;
        END;
    END LOOP;
    
    RAISE NOTICE 'Profile creation complete!';
END;
$$;

-- Step 6: Create a view for easy member verification
CREATE OR REPLACE VIEW member_accounts_status AS
SELECT 
    p.full_name,
    p.email,
    p.avatar_url,
    p.using_temp_email,
    p.must_change_password,
    p.is_active,
    u.created_at as account_created,
    u.last_sign_in_at,
    u.email_confirmed_at,
    CASE 
        WHEN u.last_sign_in_at IS NULL THEN 'Never logged in'
        WHEN p.using_temp_email THEN 'Needs email update'
        WHEN p.must_change_password THEN 'Needs password change'
        ELSE 'Account complete'
    END as status
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.role = 'member'
ORDER BY p.full_name;

-- Step 7: Verification queries
-- Run these after account creation to verify everything is set up correctly

-- Query 1: Check how many members need accounts
SELECT 
    'Total members in folder' as description,
    39 as count
UNION ALL
SELECT 
    'Members with accounts',
    COUNT(*) 
FROM auth.users 
WHERE email LIKE '%@temp.dlob.local'
UNION ALL
SELECT 
    'Members with profiles',
    COUNT(*) 
FROM profiles 
WHERE using_temp_email = true;

-- Query 2: List all member accounts
SELECT * FROM member_accounts_status;

-- Query 3: Find members who have logged in
SELECT 
    full_name,
    email,
    last_sign_in_at,
    CASE 
        WHEN using_temp_email THEN '⚠️ Temporary email'
        ELSE '✓ Email updated'
    END as email_status,
    CASE 
        WHEN must_change_password THEN '⚠️ Needs password change'
        ELSE '✓ Password changed'
    END as password_status
FROM member_accounts_status
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC;

-- Query 4: Members who haven't logged in yet
SELECT 
    full_name,
    email,
    account_created
FROM member_accounts_status
WHERE last_sign_in_at IS NULL
ORDER BY full_name;

COMMENT ON COLUMN profiles.using_temp_email IS 'True if user is using temporary @temp.dlob.local email';
COMMENT ON COLUMN profiles.must_change_password IS 'True if user must change password on next login';
COMMENT ON FUNCTION create_member_profiles() IS 'Backup function to create profiles for members with temp emails';
COMMENT ON VIEW member_accounts_status IS 'Shows status of all member accounts including login and update status';

-- =====================================
-- SUMMARY
-- =====================================
-- This script prepares the database for member accounts.
-- 
-- To actually create the accounts, use one of these methods:
-- 
-- 1. Node.js script (see create-members-script.js)
-- 2. API endpoint (see /api/admin/bulk-create-accounts)
-- 3. PowerShell script (see create-members.ps1)
-- 
-- All members will login with:
-- - Email: [username]@temp.dlob.local
-- - Password: DLOB2026
-- 
-- On first login, they will be prompted to:
-- 1. Update their real email address
-- 2. Set a new password
-- =====================================
