-- =====================================================
-- DLOB AI SURVEY SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Created: February 21, 2026
-- Purpose: Automatic conversational AI surveys for offline programs
-- Features: Auto-triggered surveys after events, AI sentiment analysis, automated insights
-- Admin Role: View-only analytics and AI-generated insights (no manual survey creation)

-- =====================================================
-- 1. SURVEY TEMPLATES TABLE
-- =====================================================
-- Stores different survey types (event feedback, feature requests, etc.)
CREATE TABLE IF NOT EXISTS public.survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'event_feedback', 'feature_request', 'satisfaction', 'custom'
  trigger_type VARCHAR(50) NOT NULL, -- 'post_event', 'scheduled', 'on_demand', 'smart'
  questions JSONB NOT NULL, -- Array of question objects
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. SURVEY INSTANCES TABLE  
-- =====================================================
-- Each time a survey is sent to members
CREATE TABLE IF NOT EXISTS public.survey_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_id UUID, -- Optional: link to specific event/match
  trigger_type VARCHAR(50) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed', 'archived'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. SURVEY RESPONSES TABLE
-- =====================================================
-- Individual member responses with AI conversation
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.survey_instances(id) ON DELETE CASCADE,
  member_id UUID, -- Nullable for anonymous responses
  
  -- Anonymous flag
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Conversation data
  conversation JSONB NOT NULL DEFAULT '[]', -- Array of {role: 'ai'|'user', message: string, timestamp: string}
  answers JSONB NOT NULL DEFAULT '{}', -- Structured answers {question_id: answer}
  
  -- AI Analysis
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00 (negative to positive)
  sentiment_label VARCHAR(20), -- 'positive', 'neutral', 'negative'
  key_topics TEXT[], -- AI-extracted topics/themes
  priority_score INT, -- 1-10, how important this feedback is
  
  -- Metadata
  completion_status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_seconds INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SURVEY INSIGHTS TABLE
-- =====================================================
-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS public.survey_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.survey_instances(id) ON DELETE CASCADE,
  
  -- Aggregated metrics
  total_responses INT DEFAULT 0,
  completion_rate DECIMAL(5,2), -- Percentage
  avg_sentiment_score DECIMAL(3,2),
  
  -- AI-generated insights
  summary TEXT, -- Overall summary of responses
  key_findings TEXT[], -- Main takeaways
  top_positive_points TEXT[], -- What members loved
  top_improvement_areas TEXT[], -- What needs improvement
  feature_requests TEXT[], -- Requested features
  actionable_recommendations TEXT[], -- AI suggestions for admin
  
  -- Trends
  sentiment_distribution JSONB, -- {positive: 45, neutral: 30, negative: 25}
  topic_frequency JSONB, -- {topic: count}
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by VARCHAR(50) DEFAULT 'ai_agent', -- 'ai_agent' or 'manual'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. SURVEY TRIGGERS TABLE
-- =====================================================
-- Scheduled and smart triggers for surveys
CREATE TABLE IF NOT EXISTS public.survey_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
  
  -- Trigger configuration
  trigger_type VARCHAR(50) NOT NULL, -- 'post_event', 'scheduled', 'smart'
  trigger_config JSONB NOT NULL, -- {schedule: 'monthly', day: 1, conditions: {...}}
  
  -- Smart trigger settings
  min_activity_threshold INT, -- Don't survey inactive members
  cooldown_days INT DEFAULT 7, -- Days before re-surveying same member
  
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  next_trigger_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_survey_responses_member ON public.survey_responses(member_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_instance ON public.survey_responses(instance_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_sentiment ON public.survey_responses(sentiment_label);
CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON public.survey_responses(completion_status);
CREATE INDEX IF NOT EXISTS idx_survey_instances_status ON public.survey_instances(status);
CREATE INDEX IF NOT EXISTS idx_survey_instances_event ON public.survey_instances(event_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_triggers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage survey templates" ON public.survey_templates;
DROP POLICY IF EXISTS "Members can view active templates" ON public.survey_templates;
DROP POLICY IF EXISTS "Admins can manage survey instances" ON public.survey_instances;
DROP POLICY IF EXISTS "Members can view active instances" ON public.survey_instances;
DROP POLICY IF EXISTS "Members can manage their own responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Admins can manage insights" ON public.survey_insights;
DROP POLICY IF EXISTS "Members can view insights" ON public.survey_insights;
DROP POLICY IF EXISTS "Admins can manage triggers" ON public.survey_triggers;

-- Templates: Admins can manage, members can view active ones
CREATE POLICY "Admins can manage survey templates"
  ON public.survey_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Members can view active templates"
  ON public.survey_templates FOR SELECT
  USING (is_active = true);

-- Instances: Admins can manage, members can view active ones
CREATE POLICY "Admins can manage survey instances"
  ON public.survey_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Members can view active instances"
  ON public.survey_instances FOR SELECT
  USING (status = 'active');

-- Responses: Allow anyone to create responses, members can manage their own, admins can see all
CREATE POLICY "Anyone can create survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own response by ID"
  ON public.survey_responses FOR UPDATE
  USING (true);

CREATE POLICY "Members can view their own responses"
  ON public.survey_responses FOR SELECT
  USING (auth.uid() = member_id OR member_id IS NULL);

CREATE POLICY "Admins can view all responses"
  ON public.survey_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insights: Admins can manage, members can view
CREATE POLICY "Admins can manage insights"
  ON public.survey_insights FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Members can view insights"
  ON public.survey_insights FOR SELECT
  USING (true);

-- Triggers: Admins only
CREATE POLICY "Admins can manage triggers"
  ON public.survey_triggers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to update sentiment label based on score
CREATE OR REPLACE FUNCTION update_sentiment_label()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sentiment_score IS NOT NULL THEN
    IF NEW.sentiment_score >= 0.3 THEN
      NEW.sentiment_label := 'positive';
    ELSIF NEW.sentiment_score <= -0.3 THEN
      NEW.sentiment_label := 'negative';
    ELSE
      NEW.sentiment_label := 'neutral';
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sentiment_label ON public.survey_responses;
CREATE TRIGGER set_sentiment_label
  BEFORE INSERT OR UPDATE ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_sentiment_label();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_survey_templates_timestamp ON public.survey_templates;
CREATE TRIGGER update_survey_templates_timestamp
  BEFORE UPDATE ON public.survey_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SEED DATA - GENERAL FEEDBACK SURVEY (ALWAYS AVAILABLE)
-- =====================================================
INSERT INTO public.survey_templates (title, description, type, trigger_type, questions)
VALUES (
  'Feedback & Saran DLOB',
  'Sampaikan feedback, saran, atau keluhan Anda tentang DLOB - manajemen, harga, pertandingan, atau apapun',
  'general_feedback',
  'always_available',
  '[
    {
      "id": "q1_anonymous",
      "type": "choice",
      "question": "Apakah Anda ingin menyampaikan feedback secara anonim?",
      "options": ["Ya, saya ingin anonim", "Tidak, cantumkan nama saya"],
      "required": true
    },
    {
      "id": "q2_topic",
      "type": "conversational",
      "question": "Tentang apa yang ingin Anda sampaikan? (manajemen, harga, pertandingan, atau lainnya)",
      "required": true
    },
    {
      "id": "q3_details",
      "type": "conversational",
      "question": "Ceritakan lebih detail, apa yang ingin Anda sampaikan?",
      "required": true
    },
    {
      "id": "q4_suggestion",
      "type": "conversational",
      "question": "Apakah Anda punya saran untuk perbaikannya?",
      "required": false
    },
    {
      "id": "q5_additional",
      "type": "conversational",
      "question": "Ada hal lain yang ingin Anda sampaikan?",
      "required": false
    }
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- CREATE PERMANENT FEEDBACK INSTANCE (ALWAYS AVAILABLE)
-- =====================================================
-- Create a permanent survey instance that never expires
INSERT INTO public.survey_instances (template_id, title, description, trigger_type, status, expires_at)
SELECT 
  id,
  'Feedback & Saran DLOB',
  'Sampaikan pendapat Anda tentang DLOB - bisa tentang apa saja!',
  'always_available',
  'active',
  NULL  -- Never expires
FROM public.survey_templates 
WHERE type = 'general_feedback'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get all active surveys for a member
-- SELECT * FROM survey_instances WHERE status = 'active' AND expires_at > NOW();

-- Get member's survey history
-- SELECT * FROM survey_responses WHERE member_id = '[user_id]' ORDER BY created_at DESC;

-- Get sentiment distribution for a survey
-- SELECT sentiment_label, COUNT(*) FROM survey_responses 
-- WHERE instance_id = '[instance_id]' GROUP BY sentiment_label;

-- Get recent insights
-- SELECT * FROM survey_insights ORDER BY generated_at DESC LIMIT 10;
