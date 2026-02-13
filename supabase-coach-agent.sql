-- Dlob Coach Agent Tables
-- This schema supports personalized coaching, progress tracking, and training recommendations

-- 1. Coaching Sessions Table (stores conversation history)
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  insights JSONB, -- Structured coaching insights
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Training Goals Table (tracks member goals)
CREATE TABLE IF NOT EXISTS training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'skill_improvement', 'win_rate', 'matches_played', 'custom'
  goal_title TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  target_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  progress_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Weaknesses Identified Table (tracks areas needing improvement)
CREATE TABLE IF NOT EXISTS identified_weaknesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weakness_type TEXT NOT NULL, -- 'backhand', 'defense', 'stamina', 'net_play', 'smash', 'footwork', etc.
  severity TEXT, -- 'critical', 'moderate', 'minor'
  identified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  recommended_drills JSONB, -- Array of drill recommendations
  status TEXT DEFAULT 'active', -- 'active', 'improving', 'resolved'
  last_assessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Training Recommendations Table (tracks video/drill suggestions)
CREATE TABLE IF NOT EXISTS training_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weakness_id UUID REFERENCES identified_weaknesses(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'video', 'drill', 'partner_practice', 'coach_session'
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT, -- Link to training video
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Progress Tracking Table (tracks improvement metrics)
CREATE TABLE IF NOT EXISTS coaching_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES training_goals(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- 'win_rate', 'backhand_accuracy', 'defense_success', etc.
  metric_value NUMERIC NOT NULL,
  measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_coaching_sessions_user ON coaching_sessions(user_id, created_at DESC);
CREATE INDEX idx_training_goals_user ON training_goals(user_id, status);
CREATE INDEX idx_weaknesses_user ON identified_weaknesses(user_id, status);
CREATE INDEX idx_recommendations_user ON training_recommendations(user_id, completed);
CREATE INDEX idx_progress_user ON coaching_progress(user_id, measurement_date DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE identified_weaknesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own coaching data
CREATE POLICY "Users can view own coaching sessions" ON coaching_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coaching sessions" ON coaching_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own training goals" ON training_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own training goals" ON training_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weaknesses" ON identified_weaknesses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own weaknesses" ON identified_weaknesses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON training_recommendations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recommendations" ON training_recommendations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON coaching_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON coaching_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update training goals progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE training_goals
  SET 
    current_value = NEW.metric_value,
    progress_percentage = CASE 
      WHEN target_value > 0 THEN (NEW.metric_value / target_value * 100)
      ELSE 0
    END,
    status = CASE
      WHEN (NEW.metric_value >= target_value) THEN 'completed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.goal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT ON coaching_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

COMMENT ON TABLE coaching_sessions IS 'Stores Dlob Coach Agent conversation history';
COMMENT ON TABLE training_goals IS 'Tracks member training goals and targets';
COMMENT ON TABLE identified_weaknesses IS 'Records identified areas needing improvement';
COMMENT ON TABLE training_recommendations IS 'Personalized training video and drill recommendations';
COMMENT ON TABLE coaching_progress IS 'Tracks progress metrics over time';
