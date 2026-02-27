# Member Name Change - Data Sync Guide

## Problem

When a member changes their name in their profile (e.g., "Ryan Radityatama" → "Adit"), their match history and payment records disappear. This happens because:

1. The database uses `member_name` (TEXT) to link records
2. Historical records still have the old name
3. Queries use the current profile name, so old data isn't found

## Solution

We've created an **automatic trigger** that syncs name changes across all tables.

---

## Step 1: Install the Trigger (One-Time Setup)

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase-sync-member-name-changes.sql
```

This creates:
- ✅ Trigger that automatically updates `match_members` and `memberships` when profile name changes
- ✅ Manual sync function `sync_member_name_manual()` for fixing existing data

---

## Step 2: Fix Existing Orphaned Data

### For Ryan's specific case:

**Option A: SQL (Recommended)**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM sync_member_name_manual('Ryan Radityatama', 'Adit');
```

**Option B: Node.js Script**
```bash
# Set environment variables first:
# NEXT_PUBLIC_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY

node fix-ryan-name-change.js
```

### For any member:

```sql
-- Check what would be affected:
SELECT COUNT(*) FROM match_members WHERE member_name = 'OldName';
SELECT COUNT(*) FROM memberships WHERE member_name = 'OldName';

-- Run the sync:
SELECT * FROM sync_member_name_manual('OldName', 'NewName');

-- Verify results:
SELECT COUNT(*) FROM match_members WHERE member_name = 'NewName';
SELECT COUNT(*) FROM memberships WHERE member_name = 'NewName';
```

---

## Step 3: Verify Fix

1. **As Ryan/Adit:**
   - Go to Member Dashboard (`/dashboard`)
   - Check if match history is visible
   - Go to Pembayaran (`/dashboard/pembayaran`)
   - Verify all payment records are shown

2. **Expected Results:**
   - All matches previously under "Ryan Radityatama" now show under "Adit"
   - All memberships synced
   - Match history restored

---

## Future-Proof

**Good news:** After installing the trigger, this issue won't happen again!

When any member changes their name in the future:
1. User updates `profiles.full_name` in settings
2. Trigger automatically fires
3. All `match_members` and `memberships` records update instantly
4. No data loss! ✅

---

## Technical Details

### Trigger Implementation

```sql
-- Fires AFTER UPDATE on profiles.full_name
CREATE TRIGGER trigger_sync_member_name
  AFTER UPDATE OF full_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_member_name_changes();
```

### What Gets Updated

Currently syncs:
- ✅ `match_members.member_name`
- ✅ `memberships.member_name`

To add more tables in the future, edit `sync_member_name_changes()` function.

### Manual Sync Function Signature

```sql
sync_member_name_manual(
  p_old_name TEXT,    -- Current name in match_members/memberships
  p_new_name TEXT     -- New name from profiles
) RETURNS TABLE(
  match_members_updated BIGINT,
  memberships_updated BIGINT
)
```

---

## Common Scenarios

### Scenario 1: Member changes nickname
**Before:** "Muhammad Aditya Pratama" → "Adit"
- ❌ Without trigger: Match history lost
- ✅ With trigger: All records automatically update

### Scenario 2: Fixing typo in name
**Before:** "Ryam Radityatama" (typo) → "Ryan Radityatama" (correct)
- ✅ Trigger handles it automatically

### Scenario 3: Member wants to use full name again
**Before:** "Adit" → "Ryan Radityatama"
- ✅ Trigger syncs back to full name

---

## Troubleshooting

### "I changed my name but still don't see my matches"

1. **Check if trigger is installed:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_sync_member_name';
   ```

2. **Manually run sync:**
   ```sql
   SELECT * FROM sync_member_name_manual('YourOldName', 'YourNewName');
   ```

3. **Clear cache and reload:**
   - Log out and log back in
   - Hard refresh (Ctrl+Shift+R)

### "Trigger not firing"

Make sure you're updating `full_name` field:
```sql
-- ✅ This triggers the sync:
UPDATE profiles SET full_name = 'NewName' WHERE id = 'user-uuid';

-- ❌ This doesn't (different field):
UPDATE profiles SET email = 'new@email.com' WHERE id = 'user-uuid';
```

---

## Long-Term Solution (Future Improvement)

For complete data integrity, consider refactoring to use `member_id` (UUID) instead of `member_name` (TEXT):

```sql
-- Future schema improvement:
ALTER TABLE match_members 
  ADD COLUMN member_id UUID REFERENCES profiles(id);

-- Then migrate data:
UPDATE match_members mm
SET member_id = p.id
FROM profiles p
WHERE mm.member_name = p.full_name;
```

But for now, the trigger solution works perfectly! 🎯
