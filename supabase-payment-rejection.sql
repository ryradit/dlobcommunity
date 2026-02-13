-- Payment Proof Rejection Schema
-- Add rejection fields to match_members and memberships tables for payment proof rejection and revision flow

-- ===== 1. UPDATE MATCH_MEMBERS TABLE =====

-- Add rejection fields to match_members
ALTER TABLE match_members 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 1;

-- Update status CHECK constraint to include 'rejected' status
-- Note: match_members likely doesn't have a CHECK constraint, but we'll add one
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'match_members_payment_status_check'
  ) THEN
    ALTER TABLE match_members DROP CONSTRAINT match_members_payment_status_check;
  END IF;
  
  -- Add new constraint with additional status
  ALTER TABLE match_members 
  ADD CONSTRAINT match_members_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'revision', 'rejected'));
END $$;

-- Create index for rejection queries on match_members
CREATE INDEX IF NOT EXISTS idx_match_members_rejected 
ON match_members(rejected_by) WHERE rejection_reason IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN match_members.rejection_reason IS 'Reason why payment proof was rejected by admin';
COMMENT ON COLUMN match_members.rejection_date IS 'Timestamp when payment proof was rejected';
COMMENT ON COLUMN match_members.rejected_by IS 'Admin ID who rejected the payment proof';
COMMENT ON COLUMN match_members.submission_count IS 'Number of times proof has been submitted (for tracking resubmissions)';

-- ===== 2. UPDATE MEMBERSHIPS TABLE =====

-- Add rejection fields to memberships
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 1;

-- Update status CHECK constraint to include 'rejected' status
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'memberships_payment_status_check'
  ) THEN
    ALTER TABLE memberships DROP CONSTRAINT memberships_payment_status_check;
  END IF;
  
  -- Add new constraint with additional status
  ALTER TABLE memberships 
  ADD CONSTRAINT memberships_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'rejected'));
END $$;

-- Create index for rejection queries on memberships
CREATE INDEX IF NOT EXISTS idx_memberships_rejected 
ON memberships(rejected_by) WHERE rejection_reason IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN memberships.rejection_reason IS 'Reason why payment proof was rejected by admin';
COMMENT ON COLUMN memberships.rejection_date IS 'Timestamp when payment proof was rejected';
COMMENT ON COLUMN memberships.rejected_by IS 'Admin ID who rejected the payment proof';
COMMENT ON COLUMN memberships.submission_count IS 'Number of times proof has been submitted (for tracking resubmissions)';

-- ===== 3. CREATE TRIGGERS FOR BOTH TABLES =====

-- Create a function to log rejection for match_members
CREATE OR REPLACE FUNCTION log_match_payment_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'rejected', set rejection_date
  IF NEW.payment_status = 'rejected' AND OLD.payment_status != 'rejected' THEN
    NEW.rejection_date = NOW();
    NEW.rejected_by = auth.uid();
  END IF;
  
  -- If payment_proof is updated (resubmission), increment counter and reset rejection
  IF NEW.payment_proof IS DISTINCT FROM OLD.payment_proof AND NEW.payment_proof IS NOT NULL THEN
    NEW.submission_count = COALESCE(OLD.submission_count, 0) + 1;
    -- Change status from rejected/revision back to pending
    IF OLD.payment_status IN ('rejected', 'revision') THEN
      NEW.payment_status = 'pending';
      NEW.rejection_reason = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for match_members
DROP TRIGGER IF EXISTS on_match_payment_rejection ON match_members;
CREATE TRIGGER on_match_payment_rejection
  BEFORE UPDATE ON match_members
  FOR EACH ROW
  EXECUTE FUNCTION log_match_payment_rejection();

-- Create a function to log rejection for memberships
CREATE OR REPLACE FUNCTION log_membership_payment_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to 'rejected', set rejection_date
  IF NEW.payment_status = 'rejected' AND OLD.payment_status != 'rejected' THEN
    NEW.rejection_date = NOW();
    NEW.rejected_by = auth.uid();
  END IF;
  
  -- If payment_proof is updated (resubmission), increment counter and reset rejection
  IF NEW.payment_proof IS DISTINCT FROM OLD.payment_proof AND NEW.payment_proof IS NOT NULL THEN
    NEW.submission_count = COALESCE(OLD.submission_count, 0) + 1;
    -- Change status from rejected back to pending
    IF OLD.payment_status = 'rejected' THEN
      NEW.payment_status = 'pending';
      NEW.rejection_reason = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for memberships
DROP TRIGGER IF EXISTS on_membership_payment_rejection ON memberships;
CREATE TRIGGER on_membership_payment_rejection
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_membership_payment_rejection();

-- ===== 4. DOCUMENTATION =====

-- Sample rejection reasons (for reference/documentation)
COMMENT ON TABLE match_members IS 
'Match payment tracking table. 
Common payment proof rejection reasons:
- Foto tidak jelas/buram
- Jumlah transfer tidak sesuai
- Rekening tujuan salah
- Tanggal transfer tidak sesuai periode
- Bukti palsu/di-edit
- Lainnya (custom reason)';

COMMENT ON TABLE memberships IS 
'Membership payment tracking table.
Common payment proof rejection reasons:
- Foto tidak jelas/buram
- Jumlah transfer tidak sesuai
- Rekening tujuan salah
- Tanggal transfer tidak sesuai periode
- Bukti palsu/di-edit
- Lainnya (custom reason)';

