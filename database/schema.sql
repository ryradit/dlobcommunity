-- DLOB Badminton Community Platform Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    membership_type VARCHAR(20) DEFAULT 'regular' CHECK (membership_type IN ('regular', 'premium')),
    is_active BOOLEAN DEFAULT true,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in_method VARCHAR(20) DEFAULT 'manual' CHECK (check_in_method IN ('qr', 'gps', 'manual')),
    location JSONB, -- Store {latitude, longitude}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one attendance per member per day
    UNIQUE(member_id, date)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'monthly', 'tournament')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'transfer', 'midtrans', 'xendit')),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TIME NOT NULL,
    court_number INTEGER,
    type VARCHAR(20) NOT NULL CHECK (type IN ('singles', 'doubles')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match participants table
CREATE TABLE match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    team VARCHAR(10) NOT NULL CHECK (team IN ('team1', 'team2')),
    position VARCHAR(10) CHECK (position IN ('player1', 'player2')), -- For doubles
    
    -- Ensure unique member per match
    UNIQUE(match_id, member_id)
);

-- Match results table
CREATE TABLE match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team1_score INTEGER NOT NULL,
    team2_score INTEGER NOT NULL,
    winner_team VARCHAR(10) NOT NULL CHECK (winner_team IN ('team1', 'team2')),
    game_scores JSONB, -- Store array of {game_number, team1_score, team2_score}
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one result per match
    UNIQUE(match_id)
);

-- AI interactions table (for logging and analytics)
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_parse', 'match_recommendation', 'performance_analysis', 'chat', 'forecast')),
    input_data JSONB NOT NULL,
    ai_response JSONB NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_payments_member_status ON payments(member_id, status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_match_participants_member ON match_participants(member_id);
CREATE INDEX idx_ai_interactions_member ON ai_interactions(member_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(type);

-- RLS (Row Level Security) Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Members can view all active members, edit their own profile
CREATE POLICY "Members can view active members" ON members FOR SELECT 
USING (is_active = true);

CREATE POLICY "Members can insert their own profile" ON members FOR INSERT 
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Members can update their own profile" ON members FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Attendance policies
CREATE POLICY "Members can view all attendance" ON attendance FOR SELECT 
USING (true);

CREATE POLICY "Members can insert their own attendance" ON attendance FOR INSERT 
WITH CHECK (auth.uid()::text = member_id::text);

-- Payment policies
CREATE POLICY "Members can view their own payments" ON payments FOR SELECT 
USING (auth.uid()::text = member_id::text);

-- Match policies  
CREATE POLICY "Members can view all matches" ON matches FOR SELECT 
USING (true);

CREATE POLICY "Members can view all match participants" ON match_participants FOR SELECT 
USING (true);

CREATE POLICY "Members can view all match results" ON match_results FOR SELECT 
USING (true);

-- AI interaction policies
CREATE POLICY "Members can view their own AI interactions" ON ai_interactions FOR SELECT 
USING (auth.uid()::text = member_id::text);

CREATE POLICY "Members can insert their own AI interactions" ON ai_interactions FOR INSERT 
WITH CHECK (auth.uid()::text = member_id::text);

-- Admin policies - Allow admins full access to all tables
-- Note: Admins are identified by having role = 'admin' in members table

-- Admin can do anything with members table
CREATE POLICY "Admins can manage all members" ON members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can do anything with attendance table
CREATE POLICY "Admins can manage all attendance" ON attendance FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can do anything with payments table
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can do anything with matches table
CREATE POLICY "Admins can manage all matches" ON matches FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can do anything with match_participants table
CREATE POLICY "Admins can manage all match participants" ON match_participants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can do anything with match_results table
CREATE POLICY "Admins can manage all match results" ON match_results FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Admin can view all AI interactions
CREATE POLICY "Admins can view all AI interactions" ON ai_interactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional)
INSERT INTO members (id, email, name, phone, role, membership_type) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@dlob.com', 'Admin User', '+628123456789', 'admin', 'premium'),
    ('00000000-0000-0000-0000-000000000002', 'member@dlob.com', 'Member User', '+628123456790', 'member', 'regular'),
    ('00000000-0000-0000-0000-000000000003', 'john@example.com', 'John Doe', '+628123456791', 'member', 'premium'),
    ('00000000-0000-0000-0000-000000000004', 'jane@example.com', 'Jane Smith', '+628123456792', 'member', 'regular'),
    ('00000000-0000-0000-0000-000000000005', 'bob@example.com', 'Bob Wilson', '+628123456793', 'member', 'regular');

-- Sample attendance
INSERT INTO attendance (member_id, date, check_in_time, check_in_method) 
SELECT id, CURRENT_DATE, NOW(), 'manual' 
FROM members WHERE role = 'member' LIMIT 2;

-- Sample payments
INSERT INTO payments (member_id, amount, type, due_date) 
SELECT id, 50000, 'monthly', CURRENT_DATE + INTERVAL '7 days'
FROM members WHERE role = 'member';