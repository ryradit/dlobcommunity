-- Check what's already in the members table
SELECT * FROM members;

-- If you see existing members, you can check if your user ID is already there:
-- SELECT * FROM members WHERE email = 'your-email@example.com';

-- If you need to update an existing record instead of inserting:
-- UPDATE members 
-- SET name = 'Your Name', phone = '+628123456789', role = 'member', is_active = true
-- WHERE email = 'your-email@example.com';