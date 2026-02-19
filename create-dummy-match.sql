-- Create Dummy Match Data for Testing Smart Actions & Suggestion Cards
-- Run this in Supabase SQL Editor

-- Insert a test match (adjust match_number to be unique)
INSERT INTO matches (
  match_number,
  shuttlecock_count,
  cost_per_shuttlecock,
  total_cost,
  cost_per_member,
  status,
  created_at,
  created_by,
  match_date
) VALUES (
  999, -- Change this to next available match number
  2,
  60000,
  120000,
  30000,
  'active',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1), -- Uses first admin user
  '2026-02-22T10:00:00Z' -- This Saturday
);

-- Get the match ID we just created
DO $$
DECLARE
  match_id_var UUID;
BEGIN
  SELECT id INTO match_id_var FROM matches WHERE match_number = 999;

  -- Insert 4 match members with different scenarios
  
  -- Member 1: Pending with proof (will appear in Auto-Confirm action)
  INSERT INTO match_members (
    match_id,
    member_name,
    amount_due,
    attendance_fee,
    has_membership,
    total_amount,
    payment_status,
    paid_at,
    payment_proof
  ) VALUES (
    match_id_var,
    'Kevin Test',
    30000,
    10000,
    false,
    40000,
    'pending',
    NULL,
    'https://example.com/proof1.jpg' -- Has proof, ready to confirm
  );

  -- Member 2: Pending with proof (will appear in Auto-Confirm action)
  INSERT INTO match_members (
    match_id,
    member_name,
    amount_due,
    attendance_fee,
    has_membership,
    total_amount,
    payment_status,
    paid_at,
    payment_proof
  ) VALUES (
    match_id_var,
    'William Test',
    30000,
    10000,
    false,
    40000,
    'pending',
    NULL,
    'https://example.com/proof2.jpg' -- Has proof, ready to confirm
  );

  -- Member 3: Pending WITHOUT proof (suspicious, high value)
  INSERT INTO match_members (
    match_id,
    member_name,
    amount_due,
    attendance_fee,
    has_membership,
    total_amount,
    payment_status,
    paid_at,
    payment_proof
  ) VALUES (
    match_id_var,
    'Alex Test',
    30000,
    10000,
    false,
    40000,
    'pending',
    NULL,
    NULL -- No proof, will trigger flag suspicious if >50k
  );

  -- Member 4: Already paid
  INSERT INTO match_members (
    match_id,
    member_name,
    amount_due,
    attendance_fee,
    has_membership,
    total_amount,
    payment_status,
    paid_at,
    payment_proof
  ) VALUES (
    match_id_var,
    'Sarah Test',
    30000,
    0, -- Has membership, no attendance fee
    true,
    30000,
    'paid',
    NOW(),
    'https://example.com/proof3.jpg'
  );

END $$;

-- Verify the data
SELECT 
  m.match_number,
  m.match_date,
  m.total_cost,
  mm.member_name,
  mm.total_amount,
  mm.payment_status,
  mm.payment_proof IS NOT NULL as has_proof
FROM matches m
JOIN match_members mm ON m.id = mm.match_id
WHERE m.match_number = 999
ORDER BY mm.created_at;

-- Expected Smart Actions results:
-- ✅ Auto-Confirm Verified (2) - Kevin Test, William Test
-- 🔍 Review High-Value (0) - None in this example (need >50k without proof)
-- 
-- To test overdue reminders, run this to backdate the match:
-- UPDATE matches SET created_at = NOW() - INTERVAL '8 days' WHERE match_number = 999;
-- UPDATE match_members SET created_at = NOW() - INTERVAL '8 days' 
-- WHERE match_id = (SELECT id FROM matches WHERE match_number = 999);
