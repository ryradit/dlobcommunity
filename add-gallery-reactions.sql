-- Add love_count column if it doesn't exist
ALTER TABLE gallery_comments 
ADD COLUMN IF NOT EXISTS love_count INT DEFAULT 0;

-- Create Reactions table for tracking loves
CREATE TABLE IF NOT EXISTS gallery_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES gallery_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: authenticated user
  anonymous_session_id TEXT, -- Session ID for anonymous users
  reaction_type TEXT DEFAULT 'love', -- love, emoji, etc
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unique indexes to prevent duplicate reactions
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_auth_unique ON gallery_comment_reactions(comment_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_reactions_anon_unique ON gallery_comment_reactions(comment_id, anonymous_session_id) WHERE anonymous_session_id IS NOT NULL;

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON gallery_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON gallery_comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_session ON gallery_comment_reactions(anonymous_session_id);

-- Enable RLS on reactions table
ALTER TABLE gallery_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "View gallery reactions" ON gallery_comment_reactions;
DROP POLICY IF EXISTS "Users can manage own reactions" ON gallery_comment_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON gallery_comment_reactions;

-- RLS Policies for reactions
CREATE POLICY "View gallery reactions" ON gallery_comment_reactions
  FOR SELECT
  USING (true); -- Anyone can view likes

CREATE POLICY "Users can manage own reactions" ON gallery_comment_reactions
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (anonymous_session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete own reactions" ON gallery_comment_reactions
  FOR DELETE
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (anonymous_session_id IS NOT NULL)
  );
