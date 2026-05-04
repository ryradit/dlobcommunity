-- Gallery Comments Table
-- Supports threaded replies, optional authentication, and admin moderation

CREATE TABLE IF NOT EXISTS gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_item_id TEXT NOT NULL, -- Image/Video ID from gallery
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: authenticated user
  display_name TEXT NOT NULL, -- Name to show (from profile if auth, or from anonymous_name)
  anonymous_session_id TEXT, -- Session ID for anonymous users
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES gallery_comments(id) ON DELETE CASCADE, -- For threaded replies
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES auth.users(id),
  love_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_user_source CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL) OR
    (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  ),
  CONSTRAINT check_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_comments_item_id ON gallery_comments(gallery_item_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_user_id ON gallery_comments(user_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_session_id ON gallery_comments(anonymous_session_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_parent ON gallery_comments(parent_comment_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_gallery_comments_created_at ON gallery_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_comments_flagged ON gallery_comments(is_flagged) WHERE is_flagged = TRUE;

-- Reactions table for tracking loves
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

-- Enable RLS
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "View gallery comments" ON gallery_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON gallery_comments;
DROP POLICY IF EXISTS "Anonymous users can comment" ON gallery_comments;
DROP POLICY IF EXISTS "Users update own comments" ON gallery_comments;

-- RLS Policies

-- SELECT: Anyone can view non-deleted comments
CREATE POLICY "View gallery comments" ON gallery_comments
  FOR SELECT
  USING (is_deleted = FALSE);

-- SELECT: Note - Admins can see all comments via direct DB query or separate admin function

-- INSERT: Authenticated users can comment
CREATE POLICY "Authenticated users can comment" ON gallery_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    user_id IS NOT NULL
  );

-- INSERT: Anonymous session-based commenting
CREATE POLICY "Anonymous users can comment" ON gallery_comments
  FOR INSERT
  WITH CHECK (
    user_id IS NULL AND
    anonymous_session_id IS NOT NULL
  );

-- UPDATE: Users can update own comments, anonymous via API only
CREATE POLICY "Users update own comments" ON gallery_comments
  FOR UPDATE
  USING (
    auth.uid() = user_id AND user_id IS NOT NULL
  )
  WITH CHECK (
    auth.uid() = user_id AND user_id IS NOT NULL
  );

-- DELETE: Only service role can hard delete (via API, not via direct RLS)
-- Admin users should use API endpoints for deletion

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

-- Database setup complete. All operations handled by API endpoints:
-- - GET /api/gallery-comments (fetch comments)
-- - POST /api/gallery-comments (create comments)
-- - PUT /api/gallery-comments (flag/soft-delete/love)
-- - DELETE /api/gallery-comments (admin hard-delete)
