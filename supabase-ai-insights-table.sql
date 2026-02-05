-- Create AI insights cache table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('performance', 'partner_recommendations', 'team_optimizer')),
  stats_hash TEXT NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(user_id, insight_type, stats_hash)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_type_hash ON ai_insights(user_id, insight_type, stats_hash);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires ON ai_insights(expires_at);

-- Add comment
COMMENT ON TABLE ai_insights IS 'Cached AI-generated insights to reduce LLM API calls. Server-side only with service role key.';
