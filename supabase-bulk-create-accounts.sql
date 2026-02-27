-- Bulk Account Creation for Existing Members
-- This script creates user accounts for members who don't have auth.users entries yet

-- INSTRUCTIONS:
-- 1. Replace 'YourTemplatePassword123!' with your desired template password
-- 2. Update the member data in the INSERT statement with your actual member list
-- 3. Run this in Supabase SQL Editor

-- Step 1: Create a temporary table for bulk member data
CREATE TEMP TABLE temp_members (
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  playing_level TEXT,
  dominant_hand TEXT,
  role TEXT DEFAULT 'member'
);

-- Step 2: Insert your member data here
-- Format: (full_name, email, phone, playing_level, dominant_hand, role)
INSERT INTO temp_members (full_name, email, phone, playing_level, dominant_hand, role) VALUES
  ('John Doe', 'john.doe@example.com', '08123456789', 'Intermediate', 'Right', 'member'),
  ('Jane Smith', 'jane.smith@example.com', '08234567890', 'Advanced', 'Left', 'member'),
  ('Bob Wilson', 'bob.wilson@example.com', '08345678901', 'Beginner', 'Right', 'member')
  -- Add more members here, separated by commas
;

-- Step 3: Display members that will be created (for verification)
SELECT 
  full_name, 
  email, 
  phone, 
  playing_level,
  'YourTemplatePassword123!' as default_password,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = temp_members.email)
    THEN 'Already exists'
    ELSE 'Will be created'
  END as status
FROM temp_members
ORDER BY full_name;

-- Step 4: Show summary
SELECT 
  COUNT(*) as total_members,
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = temp_members.email)) as existing_accounts,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = temp_members.email)) as new_accounts_needed
FROM temp_members;

-- =====================================
-- IMPORTANT: Manual Account Creation Required
-- =====================================
-- Supabase doesn't allow bulk auth.users creation via SQL for security reasons.
-- You must use the Admin API or Supabase Dashboard.
-- 
-- Options:
-- 1. Use the API endpoint (recommended): POST to /api/admin/bulk-create-accounts
-- 2. Use Supabase Dashboard: Authentication > Users > Invite User (one by one)
-- 3. Use Supabase Admin API with service role key
-- =====================================

-- Step 5: After creating auth.users via API, run this to ensure profiles exist
-- (The trigger should create them automatically, but run this as backup)
DO $$
DECLARE
  member_record RECORD;
  user_id UUID;
BEGIN
  FOR member_record IN SELECT * FROM temp_members LOOP
    -- Find the user ID from auth.users
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = member_record.email;
    
    IF user_id IS NOT NULL THEN
      -- Upsert profile
      INSERT INTO profiles (
        id, 
        full_name, 
        email, 
        phone, 
        playing_level, 
        dominant_hand, 
        role, 
        is_active
      ) VALUES (
        user_id,
        member_record.full_name,
        member_record.email,
        member_record.phone,
        member_record.playing_level,
        member_record.dominant_hand,
        member_record.role,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        playing_level = EXCLUDED.playing_level,
        dominant_hand = EXCLUDED.dominant_hand;
      
      RAISE NOTICE 'Profile created/updated for: %', member_record.email;
    ELSE
      RAISE NOTICE 'No auth.users found for: %', member_record.email;
    END IF;
  END LOOP;
END $$;

-- Step 6: Verify created profiles
SELECT 
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.is_active,
  u.email_confirmed_at,
  u.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email IN (SELECT email FROM temp_members)
ORDER BY p.full_name;

-- Clean up temp table
DROP TABLE IF EXISTS temp_members;

-- =====================================
-- NEXT STEPS FOR MEMBERS:
-- =====================================
-- 1. Send welcome email with:
--    - Login URL: https://yourdomain.com/login
--    - Email address (their account username)
--    - Template password: YourTemplatePassword123!
--    - Instructions to change password on first login
-- 2. (Optional) Force password reset on first login
-- =====================================
