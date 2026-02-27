-- =====================================================
-- SIMPLIFIED DAILY ATTENDANCE FEE - No New Table Needed
-- =====================================================
-- Purpose: Track once-per-day attendance fee using existing match_members table
-- Logic: Check if member already has a match today with attendance_fee > 0
--        If yes = already paid, skip attendance for subsequent matches
--        If no = first match today, charge attendance fee

-- =====================================================
-- ADD match_number COLUMN TO matches
-- =====================================================
-- Sequential match numbering per day (#1, #2, #3... resets each day)
-- NOTE: match_number should ALWAYS be used with match_date to avoid ambiguity
-- Example: "Match #5 on 2026-02-22" not just "Match #5"

ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS match_number INTEGER;

COMMENT ON COLUMN public.matches.match_number IS 
  'Sequential match number for the day (1, 2, 3...). Resets to 1 for each new play day. ALWAYS use with match_date to avoid ambiguity.';

-- =====================================================
-- ADD match_code COLUMN TO matches (RECOMMENDED FOR DISPLAY)
-- =====================================================
-- Unique match identifier pattern: YYYYMMDD-NN
-- Examples: "20260222-01", "20260222-15", "20260229-01"
-- Benefits: Unique, sortable, human-readable, no ambiguity
-- NOTE: Using trigger instead of GENERATED column because TO_CHAR() is not IMMUTABLE

ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS match_code TEXT;

COMMENT ON COLUMN public.matches.match_code IS 
  'Unique match identifier in format YYYYMMDD-NN (e.g., 20260222-01). Auto-generated from match_date + match_number via trigger. Use this for display to users.';

-- =====================================================
-- TRIGGER FUNCTION: Auto-generate match_code
-- =====================================================
CREATE OR REPLACE FUNCTION set_match_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate match_code from match_date and match_number
  -- Format: YYYYMMDD-NN (e.g., "20260222-01")
  IF NEW.match_number IS NOT NULL AND NEW.match_date IS NOT NULL THEN
    NEW.match_code := TO_CHAR(NEW.match_date, 'YYYYMMDD') || '-' || LPAD(NEW.match_number::TEXT, 2, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set match_code on INSERT/UPDATE
DROP TRIGGER IF EXISTS trigger_set_match_code ON public.matches;
CREATE TRIGGER trigger_set_match_code
  BEFORE INSERT OR UPDATE OF match_date, match_number
  ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION set_match_code();

-- =====================================================
-- UPDATE EXISTING MATCHES: Populate match_code
-- =====================================================
-- For any existing matches that already have match_number, generate their match_code
UPDATE public.matches
SET match_code = TO_CHAR(match_date, 'YYYYMMDD') || '-' || LPAD(match_number::TEXT, 2, '0')
WHERE match_number IS NOT NULL 
  AND match_date IS NOT NULL
  AND (match_code IS NULL OR match_code = '');

-- Add index for efficient lookups by match code
CREATE INDEX IF NOT EXISTS idx_matches_match_code 
  ON public.matches(match_code);

-- Add index for date+number lookups
CREATE INDEX IF NOT EXISTS idx_matches_date_number 
  ON public.matches(match_date, match_number);

-- =====================================================
-- HELPER FUNCTION: Get next match number for a date
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_match_number(p_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the maximum match number for this date and add 1
  -- If no matches exist for this date, return 1
  SELECT COALESCE(MAX(match_number), 0) + 1
  INTO next_number
  FROM public.matches
  WHERE DATE(match_date) = DATE(p_date);
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_match_number IS 
  'Get the next sequential match number for a given date. Returns 1 for first match of the day.';

-- =====================================================
-- ADD attendance_paid_this_entry COLUMN TO match_members
-- =====================================================
-- This marks which match_members entry actually PAID the attendance fee
-- (vs just showing the fee amount but not charging it)

ALTER TABLE public.match_members 
  ADD COLUMN IF NOT EXISTS attendance_paid_this_entry BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.match_members.attendance_paid_this_entry IS 
  'TRUE if this entry charged the attendance fee, FALSE if member already paid via different match today';

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_match_members_member_name 
  ON public.match_members(member_name);

CREATE INDEX IF NOT EXISTS idx_match_members_attendance_paid 
  ON public.match_members(attendance_paid_this_entry);

-- =====================================================
-- HELPER FUNCTION: Check if member paid attendance today
-- =====================================================
CREATE OR REPLACE FUNCTION has_paid_attendance_today(
  p_member_name TEXT,
  p_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  already_paid BOOLEAN;
BEGIN
  -- Check if any match_members entry exists for this member on this date
  -- where attendance was actually charged (attendance_paid_this_entry = true)
  SELECT EXISTS (
    SELECT 1
    FROM public.match_members mm
    JOIN public.matches m ON mm.match_id = m.id
    WHERE mm.member_name = p_member_name
      AND DATE(m.match_date) = p_date
      AND mm.attendance_paid_this_entry = true
  ) INTO already_paid;
  
  RETURN already_paid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_paid_attendance_today IS 
  'Check if member already paid attendance fee today by looking at existing match_members entries';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get next match number for today:
-- SELECT get_next_match_number(NOW());
-- Returns: 1 (if no matches today), 16 (if 15 matches already exist)

-- Check if member paid attendance today:
-- SELECT has_paid_attendance_today('Peno', '2026-02-22');
-- Returns: true or false

-- =====================================================
-- RECOMMENDED: Use match_code for display (unique identifier)
-- =====================================================

-- Get all matches for a day with unique match codes:
-- SELECT 
--   match_code,        -- e.g., "20260222-01", "20260222-02"
--   match_number,      -- e.g., 1, 2, 3
--   match_date,
--   shuttlecock_count
-- FROM matches
-- WHERE DATE(match_date) = '2026-02-22'
-- ORDER BY match_number;

-- Find a specific match by match_code (no ambiguity!):
-- SELECT * FROM matches WHERE match_code = '20260222-05';
-- vs.
-- SELECT * FROM matches WHERE match_number = 5  -- ❌ AMBIGUOUS! Which day?

-- Get all matches for a member with unique match codes:
-- SELECT 
--   m.match_code,              -- "20260222-05"
--   TO_CHAR(m.match_date, 'DD Mon') as date,  -- "22 Feb"
--   mm.amount_due AS shuttlecock_cost,
--   mm.attendance_fee,
--   mm.attendance_paid_this_entry,
--   mm.has_membership
-- FROM match_members mm
-- JOIN matches m ON mm.match_id = m.id
-- WHERE mm.member_name = 'Peno'
--   AND DATE(m.match_date) = '2026-02-22'
-- ORDER BY m.match_number;

-- Expected output:
-- match_code   | date   | shuttlecock_cost | attendance_fee | attendance_paid_this_entry | has_membership
-- 20260222-05  | 22 Feb | 9000             | 18000          | TRUE                       | FALSE
-- 20260222-08  | 22 Feb | 9000             | 0              | FALSE                      | FALSE
-- 20260222-12  | 22 Feb | 9000             | 0              | FALSE                      | FALSE

-- Get summary of daily attendance payments:
-- SELECT 
--   mm.member_name,
--   COUNT(*) as total_matches,
--   SUM(CASE WHEN mm.attendance_paid_this_entry THEN 1 ELSE 0 END) as attendance_charged_count,
--   MAX(mm.attendance_fee) as attendance_fee_amount,
--   bool_or(mm.has_membership) as has_membership
-- FROM match_members mm
-- JOIN matches m ON mm.match_id = m.id
-- WHERE DATE(m.match_date) = '2026-02-22'
-- GROUP BY mm.member_name
-- ORDER BY mm.member_name;

-- Expected result:
-- member_name | total_matches | attendance_charged_count | attendance_fee_amount | has_membership
-- Peno        | 3             | 1                        | 18000                 | false
-- Adnan       | 3             | 0                        | 0                     | true

-- View matches across multiple weeks (shows unique codes):
-- SELECT 
--   m.match_code,
--   DATE(m.match_date) as play_date,
--   m.match_number,
--   COUNT(DISTINCT mm.member_name) as players,
--   m.shuttlecock_count
-- FROM matches m
-- LEFT JOIN match_members mm ON m.id = mm.match_id
-- WHERE DATE(m.match_date) IN ('2026-02-22', '2026-02-29')
-- GROUP BY m.match_code, DATE(m.match_date), m.match_number, m.id, m.shuttlecock_count
-- ORDER BY DATE(m.match_date), m.match_number;

-- Expected output (NO AMBIGUITY!):
-- match_code   | play_date   | match_number | players | shuttlecock_count
-- 20260222-01  | 2026-02-22  | 1            | 4       | 3
-- 20260222-02  | 2026-02-22  | 2            | 4       | 4
-- 20260222-15  | 2026-02-22  | 15           | 4       | 3
-- 20260229-01  | 2026-02-29  | 1            | 4       | 2  ✅ Different code, no confusion!
-- 20260229-02  | 2026-02-29  | 2            | 4       | 3

-- =====================================================
-- ALTERNATIVE: If you prefer just using match_id (UUID)
-- =====================================================
-- You can also just use the existing match_id for uniqueness:
-- SELECT id, match_date FROM matches WHERE id = '[uuid-here]';
-- 
-- But match_code is more human-friendly:
-- - Match ID:   'a1b2c3d4-e5f6-7890-abcd-ef1234567890' (hard to remember/say)
-- - Match Code: '20260222-05' (easy: "Saturday Feb 22, Match 5")

