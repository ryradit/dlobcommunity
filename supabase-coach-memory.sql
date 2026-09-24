-- ==============================================================================
-- DLOB AI Coach: Knowledge Graph & Persistent Memory Schema
-- Provides structured entity recall, graph relationship traversals,
-- and longitudinal metric progression for the AI Coach Agent.
-- ==============================================================================

-- 1. ENTITIES (Graph Nodes)
CREATE TABLE IF NOT EXISTS coach_memory_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, 
    -- 'player', 'opponent', 'partner', 'skill', 'weakness', 
    -- 'drill', 'match_event', 'insight', 'goal', 'video_analysis'
  name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  confidence FLOAT DEFAULT 1.0, -- 0.0 to 1.0, can decay over time
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  mention_count INT DEFAULT 1,
  source_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_coach_memory_entity UNIQUE (user_id, entity_type, name)
);

-- 2. EDGES (Graph Relationships)
CREATE TABLE IF NOT EXISTS coach_memory_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES coach_memory_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES coach_memory_entities(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
    -- 'weak_at', 'strong_at', 'lost_to', 'beat', 'partners_with',
    -- 'trained_with_drill', 'improved_by', 'caused_by', 'related_to',
    -- 'measured_at', 'video_showed'
  weight FLOAT DEFAULT 1.0,
  properties JSONB DEFAULT '{}'::jsonb,
  evidence_session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_coach_memory_edge UNIQUE (user_id, source_entity_id, target_entity_id, relation_type)
);

-- 3. SNAPSHOTS (Progression Metric Tracking over Time)
CREATE TABLE IF NOT EXISTS coach_memory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES coach_memory_entities(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- e.g. 'win_rate', 'coverage_efficiency', 'backhand_score'
  metric_value NUMERIC NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT, -- 'match', 'video_analysis', 'coach_session', 'drill'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_coach_mem_entities_user ON coach_memory_entities(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_coach_mem_entities_lookup ON coach_memory_entities(user_id, name);
CREATE INDEX IF NOT EXISTS idx_coach_mem_entities_recent ON coach_memory_entities(user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_mem_edges_user ON coach_memory_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_mem_edges_source ON coach_memory_edges(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_coach_mem_edges_target ON coach_memory_edges(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_coach_mem_edges_rel ON coach_memory_edges(user_id, relation_type);

CREATE INDEX IF NOT EXISTS idx_coach_mem_snapshots_user ON coach_memory_snapshots(user_id, metric_name, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_mem_snapshots_entity ON coach_memory_snapshots(entity_id, measured_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE coach_memory_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_memory_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_memory_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_memory_entities
CREATE POLICY "Users can view own memory entities" ON coach_memory_entities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory entities" ON coach_memory_entities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory entities" ON coach_memory_entities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory entities" ON coach_memory_entities
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coach_memory_edges
CREATE POLICY "Users can view own memory edges" ON coach_memory_edges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory edges" ON coach_memory_edges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory edges" ON coach_memory_edges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory edges" ON coach_memory_edges
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for coach_memory_snapshots
CREATE POLICY "Users can view own memory snapshots" ON coach_memory_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory snapshots" ON coach_memory_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory snapshots" ON coach_memory_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Documentation Comments
COMMENT ON TABLE coach_memory_entities IS 'Knowledge graph nodes storing badminton entities, weaknesses, drills, partners, and insights for personalized coaching';
COMMENT ON TABLE coach_memory_edges IS 'Knowledge graph relationships linking entities (e.g., player weak_at Backhand Clear, partner partners_with Wiwin)';
COMMENT ON TABLE coach_memory_snapshots IS 'Time-series progression metrics for evaluating skill and performance trajectory over time';
