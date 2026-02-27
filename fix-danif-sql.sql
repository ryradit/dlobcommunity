-- Fix Danif's March 2026 Match Record
-- Run this in Supabase SQL Editor

-- Update Danif's record for March 7, 2026 match
UPDATE match_members
SET 
  has_membership = false,
  attendance_fee = 18000
WHERE 
  match_id = '657849f3-f7ae-476c-8943-5c65b755c0a3'
  AND member_name = 'Danif';

-- Verify the update
SELECT 
  member_name,
  amount_due,
  attendance_fee,
  has_membership,
  payment_status
FROM match_members
WHERE match_id = '657849f3-f7ae-476c-8943-5c65b755c0a3'
ORDER BY member_name;
