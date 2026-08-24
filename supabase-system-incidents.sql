-- ============================================================================
-- DLOB COMMUNITY: System Incidents & Outage Records Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  service_name TEXT NOT NULL,          -- 'gemini', 'supabase', 'email', 'whatsapp', 'gdrive', 'all'
  impact TEXT NOT NULL DEFAULT 'minor', -- 'minor', 'major', 'critical', 'maintenance'
  status TEXT NOT NULL DEFAULT 'resolved', -- 'investigating', 'identified', 'monitoring', 'resolved'
  description TEXT,
  resolution TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system_auto' -- admin email / user_id or 'system_auto'
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_system_incidents_started ON public.system_incidents (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_incidents_service ON public.system_incidents (service_name);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents (status);

-- Enable RLS
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent 42710 already exists error
DROP POLICY IF EXISTS "Allow public read access on system_incidents" ON public.system_incidents;
DROP POLICY IF EXISTS "Allow authenticated insert on system_incidents" ON public.system_incidents;
DROP POLICY IF EXISTS "Allow authenticated update on system_incidents" ON public.system_incidents;

-- 1. Anyone can view system incidents (Public transparency)
CREATE POLICY "Allow public read access on system_incidents"
  ON public.system_incidents
  FOR SELECT
  USING (true);

-- 2. Allow service role & authenticated users to insert/update incidents
CREATE POLICY "Allow authenticated insert on system_incidents"
  ON public.system_incidents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on system_incidents"
  ON public.system_incidents
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Seed initial baseline record (Example past maintenance/stability confirmation)
INSERT INTO public.system_incidents (title, service_name, impact, status, description, resolution, started_at, resolved_at)
VALUES (
  'Pembaruan Arsitektur & Monitoring Sistem DLOB 2026',
  'all',
  'maintenance',
  'resolved',
  'Pemeliharaan berkala untuk peningkatan kecepatan database Supabase dan integrasi Google Gemini 2.5 Flash.',
  'Pembaruan selesai tanpa downtime signifikan. Seluruh integrasi API berjalan dengan performa optimal.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '18 minutes'
) ON CONFLICT DO NOTHING;
