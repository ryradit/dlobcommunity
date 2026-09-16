-- ============================================================
-- DLOB Community: DLBC Admin Features Migration
-- Features: Pengeluaran OPEX with branch_id, Branch-aware Keuangan RPC, RLS Policies
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ADD branch_id TO public.pengeluaran TABLE
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pengeluaran') THEN
    ALTER TABLE public.pengeluaran 
      ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) DEFAULT 'dlob-pusat';
    
    -- Backfill existing rows
    UPDATE public.pengeluaran SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;
    
    -- Add index for branch-scoped queries
    CREATE INDEX IF NOT EXISTS idx_pengeluaran_branch_tanggal 
      ON public.pengeluaran(branch_id, tanggal DESC);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. UPDATE RLS POLICIES ON public.pengeluaran
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all expenses" ON public.pengeluaran;
DROP POLICY IF EXISTS "Admins and branch admins can view expenses" ON public.pengeluaran;
DROP POLICY IF EXISTS "Admins and branch admins can insert expenses" ON public.pengeluaran;
DROP POLICY IF EXISTS "Admins and branch admins can update expenses" ON public.pengeluaran;
DROP POLICY IF EXISTS "Admins and branch admins can delete expenses" ON public.pengeluaran;

-- Unified policy: Super Admin can manage all; Branch Admin can manage their branch
CREATE POLICY "Admins and branch admins can manage expenses"
  ON public.pengeluaran FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'branch_admin' AND (pengeluaran.branch_id = profiles.branch_id OR pengeluaran.branch_id IS NULL))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'branch_admin' AND pengeluaran.branch_id = profiles.branch_id)
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. BRANCH-AWARE RPC: get_monthly_keuangan_by_branch
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_monthly_keuangan_by_branch(
  target_month DATE DEFAULT CURRENT_DATE,
  p_branch_id TEXT DEFAULT 'dlob-pusat'
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

  -- Calculate PENDAPATAN from match payments for specified branch
  SELECT COALESCE(SUM(total_amount), 0) INTO v_pendapatan_matches
  FROM public.match_members
  WHERE payment_status = 'paid'
    AND branch_id = p_branch_id
    AND paid_at::DATE BETWEEN month_start AND month_end;

  -- Calculate PENDAPATAN from membership payments for specified branch
  SELECT COALESCE(SUM(amount), 0) INTO v_pendapatan_memberships
  FROM public.memberships
  WHERE payment_status = 'paid'
    AND branch_id = p_branch_id
    AND paid_at::DATE BETWEEN month_start AND month_end;

  -- Total PENDAPATAN = matches + memberships
  v_total_pendapatan := v_pendapatan_matches + v_pendapatan_memberships;

  -- Calculate PENGELUARAN by category for specified branch
  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_sewa
  FROM public.pengeluaran
  WHERE category = 'court_rent'
    AND branch_id = p_branch_id
    AND tanggal BETWEEN month_start AND month_end;

  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_shuttlecock
  FROM public.pengeluaran
  WHERE category = 'shuttlecock'
    AND branch_id = p_branch_id
    AND tanggal BETWEEN month_start AND month_end;

  SELECT COALESCE(SUM(jumlah), 0) INTO v_pengeluaran_lainnya
  FROM public.pengeluaran
  WHERE category = 'others'
    AND branch_id = p_branch_id
    AND tanggal BETWEEN month_start AND month_end;

  -- Total PENGELUARAN = sewa + shuttlecock + lainnya
  v_total_pengeluaran := v_pengeluaran_sewa + v_pengeluaran_shuttlecock + v_pengeluaran_lainnya;

  -- Keuntungan (Net Profit) = Pendapatan - Pengeluaran
  RETURN QUERY SELECT 
    v_total_pendapatan,
    v_total_pengeluaran,
    (v_total_pendapatan - v_total_pengeluaran) AS keuntungan,
    v_pengeluaran_sewa,
    v_pengeluaran_shuttlecock,
    v_pengeluaran_lainnya;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 4. BRANCH-AWARE RPC: get_next_match_number_by_branch
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_next_match_number_by_branch(
  p_date TIMESTAMP WITH TIME ZONE,
  p_branch_id TEXT DEFAULT 'dlob-pusat'
)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(match_number), 0) + 1
  INTO next_number
  FROM public.matches
  WHERE DATE(match_date) = DATE(p_date)
    AND (branch_id = p_branch_id OR (p_branch_id = 'dlob-pusat' AND branch_id IS NULL));
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
