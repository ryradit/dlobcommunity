-- Create coaching_sessions table for storing conversation history
-- This enables continuity in coaching by providing context from previous sessions

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation data
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  response_type VARCHAR(50) DEFAULT 'provide_analysis', -- 'ask_weakness' or 'provide_analysis'
  
  -- Structured response components (for easy access and analysis)
  key_finding JSONB, -- { severity, title, stats[] }
  action_items JSONB, -- Array of { title, description, priority, timeframe, expectedOutcome }
  expected_results JSONB, -- { timeframe, target, metric }
  weakness_options JSONB, -- Array of weakness options if response_type='ask_weakness'
  
  -- Complete response for reference
  full_response JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Index for fast queries by user and date (for fetching session history)
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_date 
  ON public.coaching_sessions(user_id, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own coaching sessions
DROP POLICY IF EXISTS "Users can view their own coaching sessions" ON public.coaching_sessions;
CREATE POLICY "Users can view their own coaching sessions"
  ON public.coaching_sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can only insert their own coaching sessions
DROP POLICY IF EXISTS "Users can insert their own coaching sessions" ON public.coaching_sessions;
CREATE POLICY "Users can insert their own coaching sessions"
  ON public.coaching_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow service role to insert (for API)
DROP POLICY IF EXISTS "Service role can manage coaching sessions" ON public.coaching_sessions;
CREATE POLICY "Service role can manage coaching sessions"
  ON public.coaching_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coaching_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_coaching_sessions_timestamp ON public.coaching_sessions;
CREATE TRIGGER trigger_coaching_sessions_timestamp
  BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_sessions_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.coaching_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.coaching_sessions TO service_role;
