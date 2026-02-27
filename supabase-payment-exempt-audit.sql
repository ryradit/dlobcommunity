-- =====================================================
-- PAYMENT EXEMPTION AUDIT LOG
-- =====================================================
-- Purpose: Track who granted/removed VIP status and when
-- Visibility: Admin-only (for accountability)
-- Use case: Admins can see history of exemption changes

-- =====================================================
-- STEP 1: Create audit log table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_exemption_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'removed')),
  granted_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_by_name TEXT NOT NULL,
  granted_by_email TEXT NOT NULL,
  pending_matches_affected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exemption_audit_member_id ON public.payment_exemption_audit(member_id);
CREATE INDEX IF NOT EXISTS idx_exemption_audit_created_at ON public.payment_exemption_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exemption_audit_granted_by ON public.payment_exemption_audit(granted_by_id);

COMMENT ON TABLE public.payment_exemption_audit IS 
  'Audit log for payment exemption (VIP status) changes. Tracks who granted/removed access and when.';

COMMENT ON COLUMN public.payment_exemption_audit.action IS 
  'Type of action: "granted" (VIP given) or "removed" (VIP revoked)';

COMMENT ON COLUMN public.payment_exemption_audit.granted_by_name IS 
  'Name of admin who performed the action';

COMMENT ON COLUMN public.payment_exemption_audit.pending_matches_affected IS 
  'Number of pending matches that were updated to Rp 0 (only for granted action)';

-- =====================================================
-- STEP 2: Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.payment_exemption_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view all exemption audit logs"
  ON public.payment_exemption_audit
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert audit logs
CREATE POLICY "Admins can create exemption audit logs"
  ON public.payment_exemption_audit
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No update or delete policies - audit logs should be immutable
-- (Keep permanent record for accountability)

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get exemption history for a specific member:
-- SELECT 
--   action,
--   granted_by_name,
--   granted_by_email,
--   pending_matches_affected,
--   created_at
-- FROM public.payment_exemption_audit
-- WHERE member_name = 'Ardo'
-- ORDER BY created_at DESC;

-- Get all exemption changes by a specific admin:
-- SELECT 
--   member_name,
--   action,
--   pending_matches_affected,
--   created_at
-- FROM public.payment_exemption_audit
-- WHERE granted_by_name = 'Adit'
-- ORDER BY created_at DESC;

-- Get recent exemption changes (last 30 days):
-- SELECT 
--   member_name,
--   action,
--   granted_by_name,
--   created_at
-- FROM public.payment_exemption_audit
-- WHERE created_at >= NOW() - INTERVAL '30 days'
-- ORDER BY created_at DESC;

-- Count exemptions granted vs removed:
-- SELECT 
--   action,
--   COUNT(*) as count
-- FROM public.payment_exemption_audit
-- GROUP BY action;
