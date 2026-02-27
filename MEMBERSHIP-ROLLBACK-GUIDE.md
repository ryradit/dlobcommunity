# Membership Rollback Feature - Guide

## Overview

The **Membership Rollback** feature allows admins to revoke/cancel a member's paid membership and return them to non-membership status. When rolled back, the member will be charged attendance fees (Rp 18,000 once per day) for their unpaid matches.

---

## Use Cases

### When to use Rollback:

1. **Refund Request** - Member wants refund and to cancel membership
2. **Administrative Error** - Membership was added by mistake
3. **Membership Violation** - Member violated membership terms
4. **Member Request** - Member prefers to return to non-membership status
5. **Payment Reversal** - Payment was reversed/cancelled

---

## How It Works

### Step 1: Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- File: supabase-membership-rollback.sql
```

This creates:
- ✅ `rollback_membership(p_membership_id)` - Execute rollback
- ✅ `preview_membership_rollback(p_membership_id)` - Preview impact before rollback

### Step 2: Admin Interface

In **Admin → Pembayaran → Memberships tab**:

1. Find the paid membership you want to rollback
2. Look for paid memberships (Status: "Lunas")
3. Click the **orange rollback button** (↶ icon)
4. Review the preview modal
5. Confirm rollback

---

## What Happens During Rollback

### 1. Preview Phase (Automatic)

When you click the rollback button, the system shows:
- **Member name** and **month/year**
- **Total pending matches** affected
- **Days affected** (how many Saturdays)
- **Total attendance fees** to be added

Example:
```
Member: Adit
Bulan: Feb 2026
Status: Lunas

Dampak Rollback:
- Pertandingan pending: 8 match
- Hari yang terpengaruh: 3 hari
- Total biaya kehadiran ditambahkan: + Rp 54,000
```

### 2. Execution Phase

After confirmation, the system:

1. **Updates all PENDING match_members records** for this member:
   - Sets `has_membership = false`
   - Adds `attendance_fee = 18000` to **first match of each day**
   - Subsequent matches on same day get `attendance_fee = 0`
   - Sets `attendance_paid_this_entry = true/false` accordingly
   - Recalculates `total_amount = amount_due + attendance_fee`

2. **Deletes the membership record** permanently

3. **Refreshes the data** to show updated amounts

---

## Attendance Fee Logic

**Important:** Attendance fees are charged **once per day**, not per match.

### Example Scenario:

**Before Rollback:**
| Match Code | Date | Shuttlecock | Attendance | Total | has_membership |
|------------|------|-------------|------------|-------|----------------|
| 20260222-03 | Feb 22 | Rp 9,000 | Gratis | Rp 9,000 | true |
| 20260222-08 | Feb 22 | Rp 9,000 | Gratis | Rp 9,000 | true |
| 20260222-12 | Feb 22 | Rp 9,000 | Gratis | Rp 9,000 | true |
| 200260229-05 | Feb 29 | Rp 9,000 | Gratis | Rp 9,000 | true |
| 20260229-10 | Feb 29 | Rp 9,000 | Gratis | Rp 9,000 | true |

**After Rollback:**
| Match Code | Date | Shuttlecock | Attendance | Total | has_membership |
|------------|------|-------------|------------|-------|----------------|
| 20260222-03 | Feb 22 | Rp 9,000 | **Rp 18,000** | **Rp 27,000** | false |
| 20260222-08 | Feb 22 | Rp 9,000 | **-** | Rp 9,000 | false |
| 20260222-12 | Feb 22 | Rp 9,000 | **-** | Rp 9,000 | false |
| 20260229-05 | Feb 29 | Rp 9,000 | **Rp 18,000** | **Rp 27,000** | false |
| 20260229-10 | Feb 29 | Rp 9,000 | **-** | Rp 9,000 | false |

**Total added:** Rp 36,000 (2 days × Rp 18,000)

---

## Technical Details

### SQL Function: `rollback_membership`

```sql
rollback_membership(p_membership_id UUID)
RETURNS TABLE(
  deleted_membership BOOLEAN,
  updated_match_records INTEGER,
  member_name TEXT,
  month INTEGER,
  year INTEGER
)
```

**What it does:**
1. Gets membership details (member_name, month, year)
2. Finds all pending matches for that member in that month
3. Groups by date to find first match per day
4. Updates attendance fees:
   - First match of day: `attendance_fee = 18000`, `attendance_paid_this_entry = true`
   - Other matches: `attendance_fee = 0`, `attendance_paid_this_entry = false`
5. Deletes the membership record
6. Returns summary

### SQL Function: `preview_membership_rollback`

```sql
preview_membership_rollback(p_membership_id UUID)
RETURNS TABLE(
  member_name TEXT,
  month INTEGER,
  year INTEGER,
  total_pending_matches BIGINT,
  matches_will_get_attendance_fee INTEGER,
  total_attendance_fees_to_add BIGINT
)
```

**What it does:**
- Counts total pending matches
- Counts distinct days (for attendance fees)
- Calculates total fees to be added
- Returns preview without making changes

---

## Important Notes

### ✅ What Gets Affected:

- **ONLY pending matches** (status: 'pending')
- **ONLY for the specific month/year** of the membership
- **Attendance fees** recalculated per day
- **Total amounts** updated automatically

### ❌ What Does NOT Get Affected:

- **Paid matches** - Already completed, no changes
- **Cancelled matches** - Already cancelled, no changes
- **Rejected matches** - Already rejected, no changes
- **Matches in other months** - Only affects membership month
- **Shuttlecock costs** - Never changed, only attendance fees

### 🔒 Safety Features:

1. **Preview before execution** - See impact before confirming
2. **Only affects pending payments** - Won't change completed transactions
3. **Per-day attendance logic** - Prevents double-charging on same day
4. **Automatic total recalculation** - No manual math errors
5. **Audit trail** - Changes are logged in database

---

## UI Features

### Rollback Button

- **Location:** Admin Pembayaran → Memberships tab → Actions column
- **Visibility:** Only shows for **PAID** memberships (Status: "Lunas")
- **Icon:** Orange rollback arrow (↶)
- **Color:** Orange (warning color)

### Rollback Modal

Shows:
- ⚠️ Warning about the action
- Member details (name, month, status)
- Impact preview (matches, days, total fees)
- Cancel and Confirm buttons
- Loading state during preview/execution

---

## Example Workflows

### Workflow 1: Member Requests Refund

1. Member contacts admin: "I want to cancel my February membership and get a refund"
2. Admin goes to Pembayaran → Memberships
3. Finds member's February membership (Status: Lunas)
4. Clicks rollback button (↶)
5. Reviews preview:
   - 5 pending matches
   - 2 Saturdays affected
   - Rp 36,000 attendance fees to add
6. Confirms rollback
7. System updates:
   - Membership deleted
   - Match records updated with attendance fees
   - Member reverted to non-membership
8. Admin processes refund externally
9. Member sees updated payment amounts

### Workflow 2: Administrative Error

1. Admin accidentally created membership for wrong member
2. Admin goes to Pembayaran → Memberships
3. Finds the incorrect membership
4. Clicks rollback button
5. Confirms rollback
6. System restores correct non-membership status

---

## Testing

### Test Scenario 1: Basic Rollback

1. Create a test member with paid membership for current month
2. Create 3 pending matches on Saturday Feb 22
3. Create 2 pending matches on Saturday Feb 29
4. Execute rollback
5. Verify:
   - ✅ First match on Feb 22 has attendance_fee = 18000
   - ✅ Other Feb 22 matches have attendance_fee = 0
   - ✅ First match on Feb 29 has attendance_fee = 18000
   - ✅ Other Feb 29 matches have attendance_fee = 0
   - ✅ All matches have has_membership = false
   - ✅ Membership record deleted

### Test Scenario 2: Preview Accuracy

1. Setup same as above
2. Click rollback button
3. Verify preview shows:
   - total_pending_matches = 5
   - matches_will_get_attendance_fee = 2
   - total_attendance_fees_to_add = 36000
4. Cancel without executing
5. Verify no changes made

---

## FAQ

**Q: Can I rollback a pending (unpaid) membership?**  
A: No, the rollback button only appears for PAID memberships. For pending memberships, use the "Batalkan" button instead.

**Q: What happens to already paid matches?**  
A: Nothing. Rollback only affects PENDING matches. Paid matches remain unchanged.

**Q: Can the member buy membership again later?**  
A: Yes! After rollback, they can purchase a new membership anytime.

**Q: Will the member be notified?**  
A: Not automatically. Admin should communicate with the member about the rollback.

**Q: Can I undo a rollback?**  
A: No, rollback is permanent. You would need to create a new membership for the member.

**Q: What if there are no pending matches?**  
A: Rollback will still delete the membership, but no match records will be updated. Preview will show 0 matches affected.

**Q: Does rollback affect future months?**  
A: No, only the specific month of the membership is affected.

---

## Troubleshooting

### "Gagal memuat preview rollback"

**Cause:** Database function not installed  
**Fix:** Run `supabase-membership-rollback.sql` in Supabase SQL Editor

### "Gagal rollback membership"

**Possible causes:**
1. Database function not installed
2. Membership already deleted
3. Database connection issue

**Fix:** Check Supabase logs and verify SQL migration was run

### Preview shows 0 matches

**Cause:** No pending matches for this member in this month  
**Expected:** This is normal if all matches are already paid/cancelled

---

## Security & Permissions

- ✅ **Admin Only** - Only admins can access rollback feature
- ✅ **Confirmation Required** - Preview modal prevents accidental clicks
- ✅ **Audit Trail** - All changes logged in database
- ✅ **Isolated to Month** - Only affects specific membership month
- ✅ **Pending Only** - Won't corrupt completed transactions

---

## Future Enhancements

Potential improvements:
1. **Rollback History** - Log of all rollbacks performed
2. **Partial Rollback** - Rollback specific matches only
3. **Automated Notifications** - Email member about rollback
4. **Refund Integration** - Track refund status
5. **Rollback Reasons** - Admin can note why rollback was done

---

## Summary

✅ **Rollback membership** returns member to non-membership status  
✅ **Attendance fees** added to pending matches (once per day)  
✅ **Only affects pending** matches, not paid ones  
✅ **Preview before execution** shows exact impact  
✅ **Automatic recalculation** of all totals  
✅ **Admin interface** with clear visual feedback  

**Result:** Clean, safe, and reversible membership management! 🔄
