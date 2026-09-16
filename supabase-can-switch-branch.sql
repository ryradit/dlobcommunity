-- ============================================================
-- Migration: Add can_switch_branch column to profiles
-- Purpose: Allow data-driven control of which users can switch
--          between DLOB Pusat and DLBC Cikupa dashboards.
--          Super admins and specific hardcoded accounts are
--          always allowed to switch; this column extends that
--          privilege to ordinary members who play in both branches.
-- ============================================================

-- 1. Add the column (idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS can_switch_branch BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Seed known dual-branch users immediately
UPDATE profiles SET can_switch_branch = TRUE
  WHERE email IN (
    'ryradit@gmail.com',           -- Adit (Super Admin)
    'dlob.official.tng@gmail.com', -- Wahyu (Dual Admin DLOB + DLBC)
    'edi@temp.dlob.local'          -- Edi (Admin DLBC + Member DLOB)
  );

-- 3. How to grant a regular member branch-switch access in the future:
--    UPDATE profiles SET can_switch_branch = TRUE WHERE email = 'member@example.com';
-- 4. How to revoke:
--    UPDATE profiles SET can_switch_branch = FALSE WHERE email = 'member@example.com';
