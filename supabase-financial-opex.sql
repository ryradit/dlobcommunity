-- =====================================================
-- FINANCIAL MANAGEMENT: OPEX TRACKING
-- =====================================================
-- Purpose: Track operational expenses for financial dashboard
-- Supports: Fixed, Variable (auto-calculated), and Manual entries

-- =====================================================
-- STEP 1: OPEX Configuration Table (Fixed recurring costs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.opex_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- e.g., 'court_rent', 'utilities_base', 'insurance'
  name TEXT NOT NULL, -- Display name
  amount DECIMAL(12,2) NOT NULL, -- Monthly fixed amount
  recurrence TEXT DEFAULT 'monthly' CHECK (recurrence IN ('monthly', 'quarterly', 'yearly')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Example fixed costs (SIMPLIFIED: Only court rent)
INSERT INTO public.opex_config (category, name, amount, recurrence, notes) VALUES
  ('court_rent', 'Sewa Lapangan Bulanan', 2500000, 'monthly', 'Fixed monthly court rental')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 2: Variable OPEX Configuration (Auto-calculation rules)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.opex_variable_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- e.g., 'shuttle_cost', 'utilities_variable'
  name TEXT NOT NULL,
  calculation_method TEXT NOT NULL, -- 'per_match', 'per_hour', 'per_player'
  unit_cost DECIMAL(12,2) NOT NULL, -- Cost per unit
  source_table TEXT, -- Where to pull data from (e.g., 'matches')
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Example variable cost rule (SIMPLIFIED: Only shuttlecock purchase)
INSERT INTO public.opex_variable_config (category, name, calculation_method, unit_cost, source_table, notes) VALUES
  ('shuttle_cost', 'Pembelian Shuttlecock', 'per_match', 15000, 'matches', 'Avg 1 tube per match = Rp 15k')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 3: Manual OPEX Entries (Optional - for any other expenses)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.opex_manual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- e.g., 'maintenance', 'marketing', 'equipment', 'misc'
  name TEXT NOT NULL, -- Description
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for date-range queries
CREATE INDEX IF NOT EXISTS idx_opex_manual_date ON public.opex_manual(expense_date DESC);

COMMENT ON TABLE public.opex_manual IS 
  'Optional: Manual expense entries for any other operational costs not covered by fixed/variable OPEX';

-- =====================================================
-- STEP 4: Enable RLS (Admin only)
-- =====================================================
ALTER TABLE public.opex_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opex_variable_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opex_manual ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage OPEX
CREATE POLICY "Admins can manage opex config"
  ON public.opex_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage variable opex config"
  ON public.opex_variable_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage manual opex"
  ON public.opex_manual FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- STEP 5: Helper Function - Calculate Total OPEX (SIMPLIFIED)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_monthly_opex(
  target_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  category TEXT,
  subcategory TEXT,
  amount DECIMAL(12,2),
  source TEXT
) AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  shuttle_matches INT;
BEGIN
  -- Calculate month boundaries
  month_start := DATE_TRUNC('month', target_month);
  month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';

  -- Return fixed OPEX (Court Rent)
  RETURN QUERY
  SELECT 
    'Fixed' as category,
    oc.name as subcategory,
    oc.amount,
    'config' as source
  FROM public.opex_config oc
  WHERE oc.is_active = true;

  -- Calculate shuttlecock costs based on matches played
  SELECT COUNT(*) INTO shuttle_matches
  FROM public.matches m
  WHERE m.match_date BETWEEN month_start AND month_end;

  RETURN QUERY
  SELECT 
    'Variable' as category,
    ovc.name as subcategory,
    (shuttle_matches * ovc.unit_cost) as amount,
    'calculated' as source
  FROM public.opex_variable_config ovc
  WHERE ovc.is_active = true;

  -- Return any manual OPEX entries (if any)
  RETURN QUERY
  SELECT 
    'Manual' as category,
    om.name as subcategory,
    om.amount,
    'manual' as source
  FROM public.opex_manual om
  WHERE om.expense_date BETWEEN month_start AND month_end;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_monthly_opex IS 
  'Calculate total monthly OPEX: Fixed (court rent) + Variable (shuttlecock based on matches) + Optional manual entries';

-- =====================================================
-- USAGE EXAMPLES (SIMPLIFIED OPEX)
-- =====================================================

-- Get current month OPEX breakdown:
-- SELECT * FROM calculate_monthly_opex(CURRENT_DATE);
-- Returns:
-- | category  | subcategory              | amount      | source     |
-- |-----------|--------------------------|-------------|------------|
-- | Fixed     | Sewa Lapangan Bulanan   | 2,500,000   | config     |
-- | Variable  | Pembelian Shuttlecock   | 1,275,000   | calculated | (85 matches × 15,000)

-- Get total OPEX for current month:
-- SELECT SUM(amount) as total_opex 
-- FROM calculate_monthly_opex(CURRENT_DATE);
-- Example result: Rp 3,775,000

-- Update court rent amount:
-- UPDATE public.opex_config 
-- SET amount = 3000000 
-- WHERE category = 'court_rent';

-- Update shuttlecock cost per match:
-- UPDATE public.opex_variable_config 
-- SET unit_cost = 18000 
-- WHERE category = 'shuttle_cost';

-- Add optional manual expense (if needed):
-- INSERT INTO public.opex_manual (category, name, amount, expense_date, notes, created_by)
-- VALUES (
--   'maintenance',
--   'Perbaikan Net Court B',
--   350000,
--   CURRENT_DATE,
--   'Net rusak, perlu ganti',
--   auth.uid()
-- );

-- Get monthly comparison (last 6 months):
-- SELECT 
--   TO_CHAR(month, 'Mon YYYY') as bulan,
--   SUM(amount) as total_opex
-- FROM (
--   SELECT generate_series(
--     CURRENT_DATE - INTERVAL '5 months',
--     CURRENT_DATE,
--     INTERVAL '1 month'
--   ) as month
-- ) months
-- CROSS JOIN LATERAL calculate_monthly_opex(month)
-- GROUP BY month
-- ORDER BY month DESC;
