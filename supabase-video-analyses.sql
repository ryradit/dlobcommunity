-- ==============================================================================
-- Table: member_video_analyses
-- Stores comprehensive video stroke & doubles tactical analysis results
-- for long-term progression tracking and historical AI Coach cross-referencing.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS member_video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  video_name TEXT,
  analysis_mode TEXT DEFAULT 'doubles_tactics', -- 'doubles_tactics' | 'stroke'
  stroke_type TEXT,
  overall_score NUMERIC,
  grade TEXT,
  court_side TEXT DEFAULT 'near_court',
  camera_view TEXT,
  user_jersey TEXT,
  partner_jersey TEXT,
  user_handedness TEXT DEFAULT 'right',
  partner_handedness TEXT DEFAULT 'right',
  doubles_metrics JSONB,       -- synergyScore, coverageEfficiency, formation, seamDefense
  court_radar JSONB,           -- userPos, partnerPos, exposedZones, rallyFrames
  biomechanics JSONB,          -- elbowAngle, stanceStability, followThrough
  key_strengths JSONB,         -- Array kelebihan
  critical_fixes JSONB,        -- Array kelemahan/koreksi
  coach_recommendation TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning-fast history retrieval
CREATE INDEX IF NOT EXISTS idx_video_analyses_user ON member_video_analyses(user_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analyses_mode ON member_video_analyses(analysis_mode);

-- Enable Row Level Security (RLS)
ALTER TABLE member_video_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Members can read and insert their own video analyses
DROP POLICY IF EXISTS "Users can view own video analyses" ON member_video_analyses;
CREATE POLICY "Users can view own video analyses" ON member_video_analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own video analyses" ON member_video_analyses;
CREATE POLICY "Users can insert own video analyses" ON member_video_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own video analyses" ON member_video_analyses;
CREATE POLICY "Users can update own video analyses" ON member_video_analyses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own video analyses" ON member_video_analyses;
CREATE POLICY "Users can delete own video analyses" ON member_video_analyses
  FOR DELETE USING (auth.uid() = user_id);
