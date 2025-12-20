-- Create session_payments table for new payment tracking system
-- This table will store payments generated from Saturday badminton sessions

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
    CONSTRAINT session_payments_amount_positive CHECK (amount > 0),
    CONSTRAINT session_payments_paid_amount_positive CHECK (paid_amount IS NULL OR paid_amount > 0),
    CONSTRAINT session_payments_status_valid CHECK (status IN ('pending', 'paid', 'partial', 'overdue'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_payments_member_id ON public.session_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_match_id ON public.session_payments(match_id);
CREATE INDEX IF NOT EXISTS idx_session_payments_status ON public.session_payments(status);
CREATE INDEX IF NOT EXISTS idx_session_payments_due_date ON public.session_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_session_payments_created_at ON public.session_payments(created_at);

-- Enable Row Level Security
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_payments

-- Policy for members to view their own payments
CREATE POLICY "Members can view their own session payments" ON public.session_payments
    FOR SELECT USING (auth.uid() = member_id);

-- Policy for admins to view all payments
CREATE POLICY "Admins can view all session payments" ON public.session_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins to insert payments
CREATE POLICY "Admins can create session payments" ON public.session_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins to update payments
CREATE POLICY "Admins can update session payments" ON public.session_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins to delete payments
CREATE POLICY "Admins can delete session payments" ON public.session_payments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.members 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_session_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_session_payments_updated_at
    BEFORE UPDATE ON public.session_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_session_payments_updated_at();

-- Insert some sample session payment records for testing
-- Note: Replace these member IDs with actual IDs from your members table

-- Sample session payments (uncomment and adjust member IDs as needed)
/*
INSERT INTO public.session_payments (member_id, type, amount, description, due_date, status) VALUES
    -- Saturday session payments
    ('replace-with-actual-member-id-1', 'session', 18000, 'Saturday Badminton Session - Non-Member Rate', '2025-01-25', 'pending'),
    ('replace-with-actual-member-id-2', 'shuttlecock', 5000, 'Shuttlecock fee for Saturday session', '2025-01-25', 'pending'),
    ('replace-with-actual-member-id-3', 'session', 0, 'Saturday Badminton Session - Member Rate (Membership Paid)', '2025-01-25', 'paid'),
    ('replace-with-actual-member-id-3', 'shuttlecock', 5000, 'Shuttlecock fee for Saturday session', '2025-01-25', 'pending');
*/

COMMENT ON TABLE public.session_payments IS 'Payment records for Saturday badminton sessions and related fees';
COMMENT ON COLUMN public.session_payments.type IS 'Type of payment: session, membership, shuttlecock, tournament';
COMMENT ON COLUMN public.session_payments.amount IS 'Total amount due (in IDR)';
COMMENT ON COLUMN public.session_payments.status IS 'Payment status: pending, paid, partial, overdue';
COMMENT ON COLUMN public.session_payments.due_date IS 'Date when payment is due';
COMMENT ON COLUMN public.session_payments.paid_date IS 'Date when payment was received';
COMMENT ON COLUMN public.session_payments.paid_amount IS 'Amount actually paid (for partial payments)';
COMMENT ON COLUMN public.session_payments.payment_method IS 'Method used for payment: cash, transfer, e-wallet, qris';