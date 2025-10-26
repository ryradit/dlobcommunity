-- DLOB AI Chat Tables
-- These tables store chat conversations and integrate with user authentication

-- Chat Sessions Table
-- Stores individual chat sessions for users
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL, -- For anonymous users
    is_authenticated BOOLEAN DEFAULT false,
    user_name TEXT, -- Store name for quick access
    user_email TEXT, -- Store email for quick access
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_user_message BOOLEAN NOT NULL,
    ai_model TEXT DEFAULT 'gemini-2.0-flash',
    response_time_ms INTEGER, -- Track AI response time
    context_used TEXT, -- What user data was used for personalization
    message_metadata JSONB, -- Store additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Context Cache Table
-- Cache frequently accessed user data for faster AI responses
CREATE TABLE IF NOT EXISTS user_context_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL, -- 'payments', 'attendance', 'matches', etc.
    context_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, context_type)
);

-- AI Analytics Table
-- Track AI usage and performance
CREATE TABLE IF NOT EXISTS ai_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    query_type TEXT NOT NULL, -- 'payment', 'attendance', 'match', 'general'
    user_authenticated BOOLEAN,
    response_generated BOOLEAN,
    error_occurred BOOLEAN,
    error_message TEXT,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_type ON user_context_cache(user_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_session ON ai_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_created_at ON ai_analytics(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;

-- Chat Sessions Policies
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND is_authenticated = false)
    );

CREATE POLICY "Users can create their own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND is_authenticated = false)
    );

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (auth.uid() IS NULL AND is_authenticated = false)
    );

-- Chat Messages Policies
CREATE POLICY "Users can view messages from their sessions" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions cs 
            WHERE cs.id = session_id AND (
                cs.user_id = auth.uid() OR 
                (auth.uid() IS NULL AND cs.is_authenticated = false)
            )
        )
    );

CREATE POLICY "Users can insert messages to their sessions" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions cs 
            WHERE cs.id = session_id AND (
                cs.user_id = auth.uid() OR 
                (auth.uid() IS NULL AND cs.is_authenticated = false)
            )
        )
    );

-- User Context Cache Policies
CREATE POLICY "Users can view their own context cache" ON user_context_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own context cache" ON user_context_cache
    FOR ALL USING (auth.uid() = user_id);

-- AI Analytics Policies (Admin only for now)
CREATE POLICY "Admins can view AI analytics" ON ai_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members m 
            WHERE m.user_id = auth.uid() AND m.role = 'admin'
        )
    );

CREATE POLICY "System can insert AI analytics" ON ai_analytics
    FOR INSERT WITH CHECK (true);

-- Functions for AI Context Retrieval

-- Function to get user's payment summary
CREATE OR REPLACE FUNCTION get_user_payment_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    payment_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'pending_payments', COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0),
        'overdue_payments', COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0),
        'total_paid', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
        'payment_count', COUNT(*),
        'last_payment_date', MAX(CASE WHEN status = 'paid' THEN created_at END),
        'next_due_date', MIN(CASE WHEN status IN ('pending', 'overdue') THEN due_date END),
        'overdue_count', COUNT(CASE WHEN status = 'overdue' THEN 1 END)
    ) INTO payment_summary
    FROM payments
    WHERE member_id IN (SELECT id FROM members WHERE user_id = p_user_id);
    
    RETURN COALESCE(payment_summary, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's match performance
CREATE OR REPLACE FUNCTION get_user_match_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    match_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_matches', COUNT(*),
        'wins', COUNT(CASE WHEN winner_id IN (
            SELECT id FROM members WHERE user_id = p_user_id
        ) THEN 1 END),
        'losses', COUNT(CASE WHEN winner_id NOT IN (
            SELECT id FROM members WHERE user_id = p_user_id
        ) AND winner_id IS NOT NULL THEN 1 END),
        'win_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN winner_id IN (
                    SELECT id FROM members WHERE user_id = p_user_id
                ) THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1)
            ELSE 0 
        END,
        'last_match_date', MAX(match_date),
        'last_match_won', MAX(CASE 
            WHEN winner_id IN (SELECT id FROM members WHERE user_id = p_user_id) 
            THEN match_date 
        END) > MAX(CASE 
            WHEN winner_id NOT IN (SELECT id FROM members WHERE user_id = p_user_id) AND winner_id IS NOT NULL
            THEN match_date 
        END),
        'recent_matches', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', match_date,
                    'opponent', CASE 
                        WHEN player1_id = (SELECT id FROM members WHERE user_id = p_user_id) 
                        THEN (SELECT name FROM members WHERE id = player2_id)
                        ELSE (SELECT name FROM members WHERE id = player1_id)
                    END,
                    'won', winner_id = (SELECT id FROM members WHERE user_id = p_user_id),
                    'score', score
                )
            )
            FROM (
                SELECT * FROM matches 
                WHERE player1_id IN (SELECT id FROM members WHERE user_id = p_user_id)
                   OR player2_id IN (SELECT id FROM members WHERE user_id = p_user_id)
                ORDER BY match_date DESC 
                LIMIT 5
            ) recent
        )
    ) INTO match_summary
    FROM matches
    WHERE player1_id IN (SELECT id FROM members WHERE user_id = p_user_id)
       OR player2_id IN (SELECT id FROM members WHERE user_id = p_user_id);
    
    RETURN COALESCE(match_summary, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's attendance summary
CREATE OR REPLACE FUNCTION get_user_attendance_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    attendance_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_sessions', COUNT(*),
        'attended_sessions', COUNT(CASE WHEN status = 'present' THEN 1 END),
        'attendance_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1)
            ELSE 0 
        END,
        'last_attendance', MAX(CASE WHEN status = 'present' THEN session_date END),
        'missed_sessions', COUNT(CASE WHEN status = 'absent' THEN 1 END),
        'streak_count', (
            -- Calculate current attendance streak
            SELECT COUNT(*) 
            FROM attendance a2 
            JOIN sessions s2 ON a2.session_id = s2.id
            WHERE a2.member_id IN (SELECT id FROM members WHERE user_id = p_user_id)
              AND s2.session_date >= (
                  SELECT COALESCE(MAX(s3.session_date), CURRENT_DATE - INTERVAL '1 year')
                  FROM attendance a3
                  JOIN sessions s3 ON a3.session_id = s3.id
                  WHERE a3.member_id IN (SELECT id FROM members WHERE user_id = p_user_id)
                    AND a3.status = 'absent'
                    AND s3.session_date < CURRENT_DATE
              )
              AND a2.status = 'present'
        )
    ) INTO attendance_summary
    FROM attendance a
    JOIN sessions s ON a.session_id = s.id
    WHERE a.member_id IN (SELECT id FROM members WHERE user_id = p_user_id);
    
    RETURN COALESCE(attendance_summary, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh user context cache
CREATE OR REPLACE FUNCTION refresh_user_context_cache(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete expired cache
    DELETE FROM user_context_cache 
    WHERE user_id = p_user_id AND expires_at < NOW();
    
    -- Refresh payment context
    INSERT INTO user_context_cache (user_id, context_type, context_data, expires_at)
    VALUES (
        p_user_id, 
        'payments', 
        get_user_payment_context(p_user_id),
        NOW() + INTERVAL '10 minutes'
    )
    ON CONFLICT (user_id, context_type) 
    DO UPDATE SET 
        context_data = EXCLUDED.context_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    -- Refresh match context
    INSERT INTO user_context_cache (user_id, context_type, context_data, expires_at)
    VALUES (
        p_user_id, 
        'matches', 
        get_user_match_context(p_user_id),
        NOW() + INTERVAL '30 minutes'
    )
    ON CONFLICT (user_id, context_type) 
    DO UPDATE SET 
        context_data = EXCLUDED.context_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    -- Refresh attendance context
    INSERT INTO user_context_cache (user_id, context_type, context_data, expires_at)
    VALUES (
        p_user_id, 
        'attendance', 
        get_user_attendance_context(p_user_id),
        NOW() + INTERVAL '30 minutes'
    )
    ON CONFLICT (user_id, context_type) 
    DO UPDATE SET 
        context_data = EXCLUDED.context_data,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_payment_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_match_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_attendance_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_context_cache(UUID) TO authenticated;