-- Score History Table for Leaderboard Tracking (FIFA-style)
-- Stores daily snapshots of player scores for trend tracking

CREATE TABLE IF NOT EXISTS score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  score DECIMAL(10, 2) NOT NULL,
  best_player_score DECIMAL(10, 2),
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  win_rate INT DEFAULT 0,
  avg_score DECIMAL(10, 2) DEFAULT 0,
  streak INT DEFAULT 0,
  snapshot_date DATE NOT NULL,  -- The date this snapshot represents
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_member_date UNIQUE(member_id, snapshot_date)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_score_history_member_date ON score_history(member_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_date ON score_history(snapshot_date DESC);

-- RLS Policies
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read score history (public leaderboard)
CREATE POLICY "Read score history" ON score_history
  FOR SELECT
  USING (true);

-- Only service role can insert/update score history (via API)
CREATE POLICY "Admins snapshot scores" ON score_history
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins update snapshots" ON score_history
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
