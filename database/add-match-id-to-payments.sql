-- Add match_id column to payments table for better tracking
-- This will link payments to specific matches

-- Add match_id column to payments table
ALTER TABLE payments 
ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_payments_match_id ON payments(match_id);

-- Update existing payments to have better notes format
UPDATE payments 
SET notes = CASE 
  WHEN type = 'daily' AND notes IS NOT NULL 
  THEN 'Session payment - ' || notes
  ELSE notes
END
WHERE type = 'daily';

-- Verify the changes
SELECT 
  COUNT(*) as total_payments,
  COUNT(match_id) as payments_with_match_id,
  COUNT(CASE WHEN type = 'daily' THEN 1 END) as daily_payments
FROM payments;

COMMENT ON COLUMN payments.match_id IS 'Links payment to specific match for tracking player participation';