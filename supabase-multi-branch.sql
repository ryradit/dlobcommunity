-- ============================================================
-- DLOB Community: Multi-Branch Architecture Migration
-- Created: 2026-09-11
-- Description: Adds multi-branch support for DLBC (DLOB Cikupa)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CREATE BRANCHES TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  accent_color TEXT DEFAULT '#4382C8',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Everyone can read branches
DROP POLICY IF EXISTS "Branches are viewable by everyone" ON branches;
CREATE POLICY "Branches are viewable by everyone"
  ON branches FOR SELECT USING (true);

-- Only super admin can modify branches (handled via service role key)
DROP POLICY IF EXISTS "Only super admin can insert branches" ON branches;
CREATE POLICY "Only super admin can insert branches"
  ON branches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Only super admin can update branches" ON branches;
CREATE POLICY "Only super admin can update branches"
  ON branches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. SEED INITIAL BRANCH DATA
-- ─────────────────────────────────────────────────────────────
INSERT INTO branches (id, name, slug, accent_color, description, is_active)
VALUES
  (
    'dlob-pusat',
    'DLOB Community',
    'pusat',
    '#4382C8',
    'Cabang utama DLOB Community',
    true
  ),
  (
    'dlob-cikupa',
    'DLOB Cikupa (DLBC)',
    'cikupa',
    '#10B981',
    'Cabang Cikupa dari DLOB Community',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. ADD branch_id TO profiles TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';

-- Update role constraint to include branch_admin
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'admin', 'branch_admin'));

-- Backfill: tag all existing profiles as dlob-pusat
UPDATE profiles SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 4. ADD branch_id TO matches TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';

UPDATE matches SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 5. ADD branch_id TO match_members TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE match_members
  ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';

UPDATE match_members SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 6. ADD branch_id TO memberships TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';

UPDATE memberships SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 7. ADD branch_id TO keuangan TABLE (if exists)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keuangan') THEN
    ALTER TABLE keuangan ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';
    UPDATE keuangan SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 8. ADD branch_id TO financial_opex TABLE (if exists)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_opex') THEN
    ALTER TABLE financial_opex ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';
    UPDATE financial_opex SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. ADD branch_id TO training_history TABLE (if exists)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_history') THEN
    ALTER TABLE training_history ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';
    UPDATE training_history SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 10. ADD branch_id TO coaching_sessions TABLE (if exists)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coaching_sessions') THEN
    ALTER TABLE coaching_sessions ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES branches(id) DEFAULT 'dlob-pusat';
    UPDATE coaching_sessions SET branch_id = 'dlob-pusat' WHERE branch_id IS NULL;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 11. UPDATE RLS POLICIES FOR PROFILES
-- ─────────────────────────────────────────────────────────────

-- Helper function: get caller's branch_id
CREATE OR REPLACE FUNCTION public.get_my_branch_id()
RETURNS TEXT AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper function: check if caller is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper function: check if caller is branch admin (or super admin)
CREATE OR REPLACE FUNCTION public.is_branch_admin(target_branch_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role = 'admin'  -- super admin sees all
        OR (role = 'branch_admin' AND branch_id = target_branch_id)
      )
  );
$$ LANGUAGE SQL SECURITY DEFINER SET search_path = public, pg_temp;

-- ─────────────────────────────────────────────────────────────
-- 12. UPDATE HANDLE_NEW_USER TRIGGER TO RESPECT BRANCH
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_branch_id TEXT;
BEGIN
  -- Read branch_id from user metadata (set during registration)
  v_branch_id := COALESCE(NEW.raw_user_meta_data->>'branch_id', 'dlob-pusat');

  INSERT INTO public.profiles (id, full_name, email, role, is_active, branch_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'member',
    true,
    v_branch_id
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    is_active = COALESCE(EXCLUDED.is_active, profiles.is_active),
    branch_id = COALESCE(EXCLUDED.branch_id, profiles.branch_id);

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ─────────────────────────────────────────────────────────────
-- 13. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_matches_branch_id ON matches(branch_id);
CREATE INDEX IF NOT EXISTS idx_match_members_branch_id ON match_members(branch_id);
CREATE INDEX IF NOT EXISTS idx_memberships_branch_id ON memberships(branch_id);

-- ─────────────────────────────────────────────────────────────
-- 14. GRANTS
-- ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.branches TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_branch_admin(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
COMMENT ON TABLE branches IS 'DLOB Community branch registry. Each branch has its own member scope.';
COMMENT ON COLUMN profiles.branch_id IS 'The branch this member belongs to (dlob-pusat or dlob-cikupa)';
COMMENT ON COLUMN profiles.role IS 'User role: member (default), admin (super admin / owner), branch_admin (branch-level admin)';
