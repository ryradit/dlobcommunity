-- Add session and member tracking to coaching_sessions table
-- Saves ONE row per complete coaching exchange (user query + coach response)

-- Add columns for session and member tracking
ALTER TABLE public.coaching_sessions
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS member_name VARCHAR(255) DEFAULT NULL;

-- Create index for fast session retrieval
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_session_id
  ON public.coaching_sessions(session_id, created_at ASC);

-- Create index for user + member + session lookups
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_member_session
  ON public.coaching_sessions(user_id, member_name, session_id, created_at ASC);

-- Create index for member classification queries
  ON public.coaching_sessions(user_id, member_name, created_at DESC);

-- Grant permissions
GRANT UPDATE ON public.coaching_sessions TO authenticated;
GRANT UPDATE ON public.coaching_sessions TO service_role;

