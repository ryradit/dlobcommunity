-- Enhanced DLOB Schema for Complete Match Management
-- Run this after the main schema.sql

-- Update matches table for doubles-only matches
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_type_check;

ALTER TABLE matches 
ADD CONSTRAINT matches_type_check CHECK (type = 'doubles');

-- Add shuttlecock tracking and field number
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS field_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS shuttlecock_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS shuttlecock_cost_per_piece INTEGER DEFAULT 3000;

-- Update match_results to store game-by-game scores
ALTER TABLE match_results 
ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 1,
DROP COLUMN IF EXISTS game_scores;

-- Add new table for detailed game scores
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, game_number)
);

-- Update payments table to include match-specific payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shuttlecock_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shuttlecock_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_fee INTEGER DEFAULT 0;

-- Add membership payments tracking
CREATE TABLE IF NOT EXISTS membership_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    weeks_in_month INTEGER NOT NULL, -- 4 or 5
    amount INTEGER NOT NULL, -- 40000 for 4 weeks, 45000 for 5 weeks
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One membership payment per member per month
    UNIQUE(member_id, month, year)
);

-- Add match attendance tracking (separate from daily attendance)
CREATE TABLE IF NOT EXISTS match_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, member_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_scores_match ON game_scores(match_id);
CREATE INDEX IF NOT EXISTS idx_membership_payments_member_month ON membership_payments(member_id, month, year);
CREATE INDEX IF NOT EXISTS idx_match_attendance_match ON match_attendance(match_id);
CREATE INDEX IF NOT EXISTS idx_match_attendance_member ON match_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_match ON payments(match_id);

-- RLS Policies
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_attendance ENABLE ROW LEVEL SECURITY;

-- Game scores policies
CREATE POLICY "Members can view all game scores" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Admins can manage game scores" ON game_scores FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Membership payments policies
CREATE POLICY "Members can view their own membership payments" ON membership_payments FOR SELECT 
USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins can manage all membership payments" ON membership_payments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Match attendance policies
CREATE POLICY "Members can view all match attendance" ON match_attendance FOR SELECT USING (true);
CREATE POLICY "Members can check themselves in" ON match_attendance FOR UPDATE 
USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins can manage all match attendance" ON match_attendance FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Sample data for testing
-- Create this month's membership payments for existing members
INSERT INTO membership_payments (member_id, month, year, weeks_in_month, amount, status)
SELECT 
    id,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    CASE WHEN EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH - 1 DAY')) >= 29 THEN 5 ELSE 4 END,
    CASE WHEN EXTRACT(DAY FROM (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '1 MONTH - 1 DAY')) >= 29 THEN 45000 ELSE 40000 END,
    CASE WHEN role = 'admin' THEN 'paid' ELSE 'pending' END
FROM members 
WHERE is_active = true
ON CONFLICT (member_id, month, year) DO NOTHING;