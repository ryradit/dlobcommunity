-- SIMPLE VERSION - Create Dummy Match (No DO block, copy-paste friendly)
-- Step 1: Insert match first
-- IMPORTANT: Change match_number to next available number!

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
  999, -- ⚠️ CHANGE THIS to unique number
  2,
  60000,
  120000,
  30000,
  'active',
  NOW(),
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  '2026-02-22T10:00:00Z'
) RETURNING id;

-- Step 2: Copy the UUID returned above, then replace YOUR_MATCH_ID below

-- Member 1: Pending WITH proof ✅
INSERT INTO match_members (
  match_id,
  member_name,
  amount_due,
  attendance_fee,
  has_membership,
  total_amount,
  payment_status,
  payment_proof
) VALUES (
  'YOUR_MATCH_ID', -- Paste match UUID here
  'Kevin Test',
  30000,
  10000,
  false,
  40000,
  'pending',
  'https://via.placeholder.com/400x300.png?text=Payment+Proof+1'
);

-- Member 2: Pending WITH proof ✅
INSERT INTO match_members (
  match_id,
  member_name,
  amount_due,
  attendance_fee,
  has_membership,
  total_amount,
  payment_status,
  payment_proof
) VALUES (
  'YOUR_MATCH_ID', -- Paste match UUID here
  'William Test',
  30000,
  10000,
  false,
  40000,
  'pending',
  'https://via.placeholder.com/400x300.png?text=Payment+Proof+2'
);

-- Member 3: Pending WITHOUT proof ⚠️
INSERT INTO match_members (
  match_id,
  member_name,
  amount_due,
  attendance_fee,
  has_membership,
  total_amount,
  payment_status,
  payment_proof
) VALUES (
  'YOUR_MATCH_ID', -- Paste match UUID here
  'Alex Test',
  30000,
  10000,
  false,
  40000,
  'pending',
  NULL
);

-- Member 4: Already PAID ✅
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
  'YOUR_MATCH_ID', -- Paste match UUID here
  'Sarah Test',
  30000,
  0,
  true,
  30000,
  'paid',
  NOW(),
  'https://via.placeholder.com/400x300.png?text=Payment+Proof+3'
);

-- ✅ VERIFICATION QUERY
SELECT 
  m.match_number,
  m.match_date,
  mm.member_name,
  mm.total_amount,
  mm.payment_status,
  CASE WHEN mm.payment_proof IS NOT NULL THEN '✅ Yes' ELSE '❌ No' END as proof
FROM matches m
JOIN match_members mm ON m.id = mm.match_id
WHERE m.match_number = 999
ORDER BY mm.created_at;
