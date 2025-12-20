-- DLOB Session Payments Table with RLS Policies
-- Run this entire script in your Supabase SQL Editor

-- ===== 1. CREATE THE TABLE =====

CREATE TABLE IF NOT EXISTS public.session_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    
    -- Payment details
    type VARCHAR(50) NOT NULL DEFAULT 'session', -- 'session', 'membership', 'shuttlecock', 'tournament'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    
    -- Payment status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'overdue'
    due_date DATE NOT NULL,
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    payment_method VARCHAR(50), -- 'cash', 'transfer', 'e-wallet', 'qris'
    
    -- Additional info
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT session_payments_amount_positive CHECK (amount >= 0),
    CONSTRAINT session_payments_paid_amount_positive CHECK (paid_amount IS NULL OR paid_amount > 0),
    CONSTRAINT session_payments_status_valid CHECK (status IN ('pending', 'paid', 'partial', 'overdue'))
);

-- ===== 2. CREATE INDEXES =====

CREATE INDEX IF NOT EXISTS idx_session_payments_member_id ON public.session_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_match_id ON public.session_payments(match_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_status ON public.session_payments(status);
CREATE INDEX IF NOT EXISTS idx_session_payments_due_date ON public.session_payments(due_date);

-- ===== 3. ENABLE ROW LEVEL SECURITY =====

ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

-- ===== 4. CREATE RLS POLICIES =====

-- Members can view their own payments
CREATE POLICY "Members view own payments" ON public.session_payments
    FOR SELECT USING (auth.uid() = member_id);

-- Admins can view all payments
CREATE POLICY "Admins view all payments" ON public.session_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can create payments
CREATE POLICY "Admins create payments" ON public.session_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update payments
CREATE POLICY "Admins update payments" ON public.session_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Members can update their own payment notes (for payment proof)
CREATE POLICY "Members update own notes" ON public.session_payments
    FOR UPDATE USING (
        auth.uid() = member_id AND status = 'pending'
    ) WITH CHECK (
        auth.uid() = member_id AND status = 'pending'
    );

-- Admins can delete payments
CREATE POLICY "Admins delete payments" ON public.session_payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== 5. CREATE UPDATE TRIGGER =====

CREATE OR REPLACE FUNCTION update_session_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_session_payments_updated_at
    BEFORE UPDATE ON public.session_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_session_payments_updated_at();

-- ===== 6. GRANT PERMISSIONS =====

GRANT ALL ON public.session_payments TO authenticated;
GRANT ALL ON public.session_payments TO service_role;

-- ===== 7. INSERT SAMPLE DATA (Optional - adjust member IDs) =====

-- Get actual member IDs from your members table
-- Replace these with real member IDs from your database
DO $$
DECLARE
    sample_member_1 UUID;
    sample_member_2 UUID;
    sample_member_3 UUID;
BEGIN
    -- Get some member IDs for sample data
    SELECT id INTO sample_member_1 FROM public.members LIMIT 1;
    SELECT id INTO sample_member_2 FROM public.members OFFSET 1 LIMIT 1;
    SELECT id INTO sample_member_3 FROM public.members OFFSET 2 LIMIT 1;
    
    -- Only insert sample data if we have members
    IF sample_member_1 IS NOT NULL THEN
        INSERT INTO public.session_payments (member_id, type, amount, description, due_date, status) VALUES
            (sample_member_1, 'session', 18000, 'Saturday Badminton Session - Non-Member Rate', CURRENT_DATE + 7, 'pending'),
            (sample_member_1, 'shuttlecock', 5000, 'Shuttlecock fee for Saturday session', CURRENT_DATE + 7, 'pending');
    END IF;
    
    IF sample_member_2 IS NOT NULL THEN
        INSERT INTO public.session_payments (member_id, type, amount, description, due_date, status) VALUES
            (sample_member_2, 'session', 0, 'Saturday Session - Member Rate (Membership Active)', CURRENT_DATE + 7, 'paid'),
            (sample_member_2, 'shuttlecock', 5000, 'Shuttlecock fee for Saturday session', CURRENT_DATE + 7, 'pending');
    END IF;
    
    IF sample_member_3 IS NOT NULL THEN
        INSERT INTO public.session_payments (member_id, type, amount, description, due_date, status) VALUES
            (sample_member_3, 'membership', 40000, 'Monthly Membership - January 2025 (4 weeks)', CURRENT_DATE + 3, 'pending');
    END IF;
    
    RAISE NOTICE 'Sample payment data inserted successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Sample data insertion skipped - adjust member IDs if needed';
END $$;

-- ===== VERIFICATION =====

-- Verify table creation
SELECT 'Table created successfully!' as status 
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'session_payments' 
    AND table_schema = 'public'
);

-- Count sample records
SELECT 
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
    SUM(amount) as total_amount
FROM public.session_payments;