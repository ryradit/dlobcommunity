-- Quick Fix: Create member profile for your existing Supabase Auth user
-- Replace 'your-email@example.com' with your actual email
-- Replace 'Your Name' with your actual name
-- Replace 'your-user-id-from-supabase-auth' with your actual user ID from Supabase Auth Users section

-- Example (replace with your actual details):
INSERT INTO members (id, email, name, phone, role, membership_type, is_active) 
VALUES (
  'abc12345-1234-1234-1234-123456789abc',  -- Replace with your User UID from Supabase Auth > Users
  'yourname@example.com',                   -- Replace with your actual registration email
  'Your Name',                              -- Replace with your actual name
  '+628123456789',                          -- Replace with your phone (optional, can be NULL)
  'member',                                 -- Role: 'member' or 'admin' (use 'admin' for admin access)
  'regular',                                -- Membership: 'regular' or 'premium'
  true                                      -- Active status
);

-- Alternative: If you want admin access, use:
-- INSERT INTO members (id, email, name, phone, role, membership_type, is_active) 
-- VALUES (
--   'your-user-id',
--   'your-email@example.com', 
--   'Your Name',
--   '+628123456789',
--   'admin',          -- This gives you admin dashboard access
--   'premium',
--   true
-- );

-- To find your user ID:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Find your email and copy the User UID
-- 3. Use that UID in the INSERT statement above