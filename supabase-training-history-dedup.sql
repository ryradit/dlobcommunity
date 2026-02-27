-- Training History Deduplication Schema
-- This prevents duplicate training queries in history by updating existing entries

-- Add a computed column for normalized query (for better matching)
ALTER TABLE training_history 
ADD COLUMN IF NOT EXISTS query_normalized text 
GENERATED ALWAYS AS (LOWER(TRIM(query))) STORED;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_training_history_user_query 
ON training_history(user_id, query_normalized);

-- Create index for recent history queries
CREATE INDEX IF NOT EXISTS idx_training_history_user_recent 
ON training_history(user_id, created_at DESC);

-- Optional: Add a function to clean up old duplicates (one-time cleanup)
CREATE OR REPLACE FUNCTION cleanup_duplicate_training_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For each user and query combination, keep only the most recent entry
  DELETE FROM training_history
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id, query_normalized 
               ORDER BY created_at DESC
             ) as rn
      FROM training_history
    ) t
    WHERE rn > 1
  );
END;
$$;

-- Run the cleanup (optional - only if you want to remove existing duplicates)
-- SELECT cleanup_duplicate_training_history();

COMMENT ON COLUMN training_history.query_normalized IS 'Normalized query for deduplication (lowercase, trimmed)';
COMMENT ON FUNCTION cleanup_duplicate_training_history() IS 'One-time cleanup function to remove duplicate training history entries';
