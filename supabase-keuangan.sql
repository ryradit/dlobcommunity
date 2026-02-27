-- =====================================================
-- KEUANGAN (FINANCIAL) MANAGEMENT - SIMPLIFIED
-- =====================================================
-- Purpose: Track Revenue (Pendapatan) and Expenses (Pengeluaran)
-- Admin can manually add/edit/delete expenses

-- =====================================================
-- STEP 1: OPEX/Pengeluaran Table (All expenses manually inputted)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('court_rent', 'shuttlecock', 'others')),
  nama TEXT NOT NULL, -- Description/name
  jumlah DECIMAL(12,2) NOT NULL, -- Amount
  tanggal DATE NOT NULL, -- Expense date
  catatan TEXT, -- Optional notes
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tanggal ON public.pengeluaran(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_category ON public.pengeluaran(category);

COMMENT ON TABLE public.pengeluaran IS 
  'Operational expenses (OPEX). Admin manually adds all expenses: court rent, shuttlecock purchases, and others.';

COMMENT ON COLUMN public.pengeluaran.category IS 
  'Expense category: court_rent (Sewa Lapangan), shuttlecock (Shuttlecock), others (Lainnya)';

-- =====================================================
-- STEP 2: Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for re-running migration)
DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.pengeluaran;

-- Policy: Only admins can manage expenses
CREATE POLICY "Admins can manage all expenses"
  ON public.pengeluaran FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- STEP 3: Helper Function - Get Monthly Summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_keuangan(
  target_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_pendapatan DECIMAL(12,2),
  total_pengeluaran DECIMAL(12,2),
  keuntungan DECIMAL(12,2),
  pengeluaran_sewa DECIMAL(12,2),
  pengeluaran_shuttlecock DECIMAL(12,2),
  pengeluaran_lainnya DECIMAL(12,2)
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  v_total_pendapatan DECIMAL(12,2);
  v_pendapatan_matches DECIMAL(12,2);
  v_pendapatan_memberships DECIMAL(12,2);
  v_total_pengeluaran DECIMAL(12,2);
  v_pengeluaran_sewa DECIMAL(12,2);
  v_pengeluaran_shuttlecock DECIMAL(12,2);
  v_pengeluaran_lainnya DECIMAL(12,2);
BEGIN
  -- Calculate month boundaries
  month_start := DATE_TRUNC('month', target_month);
  month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';

  -- Calculate PENDAPATAN from match payments
  SELECT COALESCE(SUM(total_amount), 0) INTO v_pendapatan_matches
  FROM public.match_members
  WHERE payment_status = 'paid'
  AND paid_at::DATE BETWEEN month_start AND month_end;

  -- Calculate PENDAPATAN from membership payments
  SELECT COALESCE(SUM(amount), 0) INTO v_pendapatan_memberships
  FROM public.memberships
  WHERE payment_status = 'paid'
  AND paid_at::DATE BETWEEN month_start AND month_end;

  -- Total PENDAPATAN = matches + memberships
  v_total_pendapatan := v_pendapatan_matches + v_pendapatan_memberships;

  -- Calculate PENGELUARAN by category
  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_sewa
  FROM public.pengeluaran
  WHERE category = 'court_rent'
  AND tanggal BETWEEN month_start AND month_end;

  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_shuttlecock
  FROM public.pengeluaran
  WHERE category = 'shuttlecock'
  AND tanggal BETWEEN month_start AND month_end;

  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_lainnya
  FROM public.pengeluaran
  WHERE category = 'others'
  AND tanggal BETWEEN month_start AND month_end;

  -- Total expenses
  v_total_pengeluaran := v_pengeluaran_sewa + v_pengeluaran_shuttlecock + v_pengeluaran_lainnya;

  -- Return summary
  RETURN QUERY SELECT 
    v_total_pendapatan,
    v_total_pengeluaran,
    (v_total_pendapatan - v_total_pengeluaran) as profit,
    v_pengeluaran_sewa,
    v_pengeluaran_shuttlecock,
    v_pengeluaran_lainnya;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_keuangan IS 
  'Get monthly financial summary: Pendapatan (revenue from match payments + membership payments), Pengeluaran (all expenses), Keuntungan (net profit)';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get current month summary:
-- SELECT * FROM get_monthly_keuangan(CURRENT_DATE);
-- Returns: total_pendapatan, total_pengeluaran, keuntungan, breakdown by category

-- Add court rent expense:
-- INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
-- VALUES ('court_rent', 'Sewa Lapangan Februari', 2500000, '2026-02-01', 'Bayar sewa bulan Feb', auth.uid());

-- Add shuttlecock purchase:
-- INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
-- VALUES ('shuttlecock', 'Beli Shuttlecock 20 tube', 300000, '2026-02-15', 'Stok shuttlecock', auth.uid());

-- Add other expense:
-- INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
-- VALUES ('others', 'Perbaikan Net Court A', 150000, '2026-02-20', 'Net rusak', auth.uid());

-- View all expenses for current month:
-- SELECT 
--   category,
--   nama,
--   jumlah,
--   tanggal,
--   catatan
-- FROM public.pengeluaran
-- WHERE tanggal >= DATE_TRUNC('month', CURRENT_DATE)
-- AND tanggal < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
-- ORDER BY tanggal DESC;

-- Update expense:
-- UPDATE public.pengeluaran 
-- SET jumlah = 2600000, updated_at = NOW()
-- WHERE id = 'expense-uuid';

-- Delete expense:
-- DELETE FROM public.pengeluaran WHERE id = 'expense-uuid';
