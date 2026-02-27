-- =====================================================
-- FIX: Update get_monthly_keuangan to use match_date
-- =====================================================
-- Problem: Function was counting revenue by paid_at date,
-- so March matches wouldn't show in March until paid.
-- Solution: Count by match_date instead.

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
  -- FIXED: Use match_date from matches table, not paid_at
  SELECT COALESCE(SUM(mm.total_amount), 0) INTO v_pendapatan_matches
  FROM public.match_members mm
  INNER JOIN public.matches m ON mm.match_id = m.id
  WHERE m.match_date::DATE BETWEEN month_start AND month_end;

  -- Calculate PENDAPATAN from membership payments
  -- Use month/year columns for memberships
  SELECT COALESCE(SUM(amount), 0) INTO v_pendapatan_memberships
  FROM public.memberships
  WHERE EXTRACT(MONTH FROM target_month) = month
  AND EXTRACT(YEAR FROM target_month) = year;

  -- Total PENDAPATAN = matches + memberships
  v_total_pendapatan := v_pendapatan_matches + v_pendapatan_memberships;

  -- Calculate PENGELUARAN by category (unchanged)
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
  'Get monthly financial summary by match date: Pendapatan (revenue from matches by match_date + memberships by month/year), Pengeluaran (expenses), Keuntungan (profit)';
