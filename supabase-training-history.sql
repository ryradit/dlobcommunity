-- Drop existing table if you want to recreate (comment this out if you want to keep existing data)
-- DROP TABLE IF EXISTS training_history CASCADE;

-- Create training_history table for storing member's training recommendations
CREATE TABLE IF NOT EXISTS training_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    query TEXT NOT NULL,
    advice TEXT NOT NULL,
    videos JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'training_history_user_id_fkey'
    ) THEN
        ALTER TABLE training_history 
        ADD CONSTRAINT training_history_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for faster lookups by user_id and created_at
CREATE INDEX IF NOT EXISTS idx_training_history_user_id ON training_history(user_id);
CREATE INDEX IF NOT EXISTS idx_training_history_created_at ON training_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_history_user_created ON training_history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own training history" ON training_history;
DROP POLICY IF EXISTS "Users can insert their own training history" ON training_history;
DROP POLICY IF EXISTS "Users can delete their own training history" ON training_history;

-- Policy: Users can only view their own training history
CREATE POLICY "Users can view their own training history"
    ON training_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own training history
CREATE POLICY "Users can insert their own training history"
    ON training_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own training history
CREATE POLICY "Users can delete their own training history"
    ON training_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE training_history IS 'Stores training recommendations history for members';
COMMENT ON COLUMN training_history.query IS 'The training question asked by the user';
COMMENT ON COLUMN training_history.advice IS 'AI-generated training advice';
COMMENT ON COLUMN training_history.videos IS 'Array of YouTube video recommendations (JSON format)';
