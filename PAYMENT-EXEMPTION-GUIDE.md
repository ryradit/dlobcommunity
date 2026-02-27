# PAYMENT EXEMPTION FEATURE GUIDE

## Overview
The Payment Exemption feature allows certain VIP/special members (like sponsors, admins, or special guests) to have completely FREE access to play. Exempt members never pay for anything and are completely excluded from all payment calculations and recaps.

**Primary Use Case:** Ardo has been granted permanent free access.

---

## Key Features

### ✅ What It Does
1. **Free Access:** Exempt members pay NOTHING
   - No shuttlecock cost (Rp 0)
   - No attendance fee (Rp 0)
   - No membership fee needed
   
2. **Automatic Handling:** When creating matches via bulk-create:
   - System checks `is_payment_exempt` flag in profiles
   - Sets all amounts to 0 automatically
   - Marks as having "membership" to avoid confusion

3. **Excluded from Recaps:** Exempt members are filtered out from:
   - Admin payment lists
   - Payment statistics and totals
   - Monthly revenue recaps
   - Collection rate calculations

4. **Special Member Dashboard:** Exempt members see:
   - VIP/Free Access card (purple gradient)
   - No payment UI/buttons
   - Clear message: "Anda memiliki akses gratis"
   - List of what's free (shuttlecock, attendance, membership)

---

## Implementation Details

### Database Schema

**Added Column:**
```sql
ALTER TABLE public.profiles 
ADD COLUMN is_payment_exempt BOOLEAN DEFAULT false;
```

**Helper Function:**
```sql
CREATE OR REPLACE FUNCTION is_member_payment_exempt(p_member_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_exempt BOOLEAN;
BEGIN
  SELECT is_payment_exempt INTO v_is_exempt
  FROM public.profiles
  WHERE LOWER(full_name) = LOWER(TRIM(p_member_name))
  LIMIT 1;
  
  RETURN COALESCE(v_is_exempt, false);
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## How It Works

### 1. **Setting a Member as Exempt**

```sql
-- Set Ardo as payment exempt
UPDATE public.profiles
SET is_payment_exempt = true
WHERE LOWER(full_name) = 'ardo';

-- Verify
SELECT id, full_name, is_payment_exempt 
FROM public.profiles 
WHERE is_payment_exempt = true;
```

### 2. **Match Creation Logic** (`/api/matches/bulk-create/route.ts`)

When creating matches:
```typescript
// Fetch profiles WITH is_payment_exempt flag
const profilePromises = playerNames.map(name => 
  supabase
    .from('profiles')
    .select('id, full_name, is_payment_exempt')
    .ilike('full_name', name)
    .single()
);

// Check if member is exempt
const matchMembers = profiles.map(profile => {
  const isExempt = profile.is_payment_exempt === true;
  
  if (isExempt) {
    console.log(`🎁 ${profile.full_name} is payment exempt - all costs = 0`);
    return {
      match_id: createdMatch.id,
      member_name: profile.full_name,
      amount_due: 0,              // ← ZERO
      attendance_fee: 0,          // ← ZERO
      has_membership: true,       // ← Mark as membership
      payment_status: 'pending',
      attendance_paid_this_entry: false,
    };
  }
  
  // Normal payment calculation for non-exempt members...
});
```

### 3. **Admin Dashboard Filtering** (`/app/admin/pembayaran/page.tsx`)

**Fetch exempt members:**
```typescript
const [exemptMembers, setExemptMembers] = useState<Set<string>>(new Set());

// In useEffect - fetch exempt members
const exemptResult = await supabase
  .from('profiles')
  .select('full_name')
  .eq('is_payment_exempt', true);

const exemptSet = new Set(exemptResult.data.map(p => p.full_name.toLowerCase().trim()));
setExemptMembers(exemptSet);
```

**Filter from display:**
```typescript
{matchMembers[match.id]
  ?.filter(member => 
    !exemptMembers.has(member.member_name.toLowerCase().trim()) && // ← Exclude exempt
    (!searchTerm || member.member_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  .map((member) => {
    // Render member row...
  })
}
```

**Exclude from stats:**
```typescript
const matchesStats = {
  totalAmount: matches.reduce((sum, match) => {
    const members = (matchMembers[match.id] || [])
      .filter(m => !exemptMembers.has(m.member_name.toLowerCase().trim())); // ← Filter
    return sum + members.reduce((memberSum, m) => memberSum + m.total_amount, 0);
  }, 0),
  // ... paidAmount, pendingAmount also filtered
};
```

### 4. **Member Dashboard** (`/app/dashboard/pembayaran/page.tsx`)

**Check if current user is exempt:**
```typescript
const [isPaymentExempt, setIsPaymentExempt] = useState(false);

// Fetch profile with is_payment_exempt flag
const result = await supabase
  .from('profiles')
  .select('full_name, email, is_payment_exempt')
  .eq('id', user.id)
  .single();

setIsPaymentExempt(result.data.is_payment_exempt === true);
```

**Show special UI:**
```typescript
if (isPaymentExempt) {
  return (
    <div>
      {/* VIP/Free Access Card */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40">
        <h2>🎉 Akses VIP/Gratis</h2>
        <p>Anda memiliki akses khusus untuk bermain secara GRATIS</p>
        
        {/* Free benefits list */}
        ✓ Biaya Shuttlecock: GRATIS
        ✓ Biaya Kehadiran: GRATIS
        ✓ Membership: GRATIS
      </div>
    </div>
  );
}
```

---

## Usage Examples

### Example 1: Set Ardo as Exempt
```sql
-- Run this in Supabase SQL Editor
UPDATE public.profiles
SET is_payment_exempt = true
WHERE LOWER(full_name) = 'ardo';

-- Check result
SELECT full_name, is_payment_exempt FROM profiles WHERE is_payment_exempt = true;
-- Returns: Ardo | true
```

### Example 2: Update Existing Ardo Matches to Zero
```sql
-- Set all of Ardo's pending matches to zero cost
UPDATE public.match_members
SET 
  amount_due = 0,
  attendance_fee = 0,
  total_amount = 0
WHERE member_name ILIKE 'Ardo'
  AND payment_status = 'pending';

-- Verify
SELECT member_name, amount_due, attendance_fee, total_amount
FROM match_members
WHERE member_name ILIKE 'Ardo'
ORDER BY created_at DESC
LIMIT 5;
```

### Example 3: Create Match with Exempt Member
```javascript
// Via Admin UI: Create match with Ardo + 3 other members
// Bulk create will automatically:
// 1. Check Ardo's is_payment_exempt = true
// 2. Set Ardo's amounts to 0
// 3. Other members pay normal amounts

POST /api/matches/bulk-create
{
  "matches": [{
    "team1_player1": "Ardo",      // ← Exempt: Rp 0
    "team1_player2": "Peno",      // ← Normal: Rp 3,000 + attendance
    "team2_player1": "Adnan",     // ← Normal: Rp 3,000 + attendance
    "team2_player2": "Ryan"       // ← Normal: Rp 3,000 + attendance
  }],
  "matchDate": "2026-02-22"
}

// Result in match_members:
// Ardo:  amount_due=0, attendance_fee=0, total_amount=0
// Peno:  amount_due=3000, attendance_fee=18000, total_amount=21000
// Adnan: amount_due=3000, attendance_fee=0, total_amount=3000 (already paid today)
// Ryan:  amount_due=3000, attendance_fee=0, total_amount=3000 (already paid today)
```

### Example 4: Admin View Excludes Ardo
```
Admin Pembayaran Page → Pertandingan #1:
┌──────────────┬─────────────┬──────────┬───────┐
│ Nama         │ Shuttlecock │ Kehadiran│ Total │
├──────────────┼─────────────┼──────────┼───────┤
│ Peno         │ Rp 3,000    │ Rp 18,000│ Rp 21k│
│ Adnan        │ Rp 3,000    │ -        │ Rp 3k │
│ Ryan         │ Rp 3,000    │ -        │ Rp 3k │
└──────────────┴─────────────┴──────────┴───────┘

❌ Ardo NOT SHOWN (filtered out because is_payment_exempt = true)

Total Revenue Stats:
✅ Only counts Peno + Adnan + Ryan (Rp 27,000)
❌ Does NOT count Ardo (Rp 0)
```

### Example 5: Ardo's Dashboard View
```
When Ardo logs in to /dashboard/pembayaran:

┌─────────────────────────────────────────────────┐
│        🎉 Akses VIP/Gratis                      │
├─────────────────────────────────────────────────┤
│ Selamat Ardo! Anda memiliki akses khusus       │
│ untuk bermain secara GRATIS.                    │
│                                                 │
│ ✓ Biaya Shuttlecock: GRATIS                    │
│ ✓ Biaya Kehadiran: GRATIS                      │
│ ✓ Membership: GRATIS                            │
│                                                 │
│ Tidak ada pembayaran yang diperlukan.          │
└─────────────────────────────────────────────────┘

❌ NO payment buttons
❌ NO upload proof UI
❌ NO pending payment list
```

---

## Testing

### Test 1: Verify Ardo is Exempt
```sql
SELECT 
  full_name, 
  is_payment_exempt,
  created_at
FROM profiles 
WHERE LOWER(full_name) = 'ardo';

-- Expected: is_payment_exempt = true
```

### Test 2: Create Match with Ardo
1. Go to Admin → Pembayaran → Buat Pertandingan
2. Add Ardo + 3 other members
3. Select date (Saturday)
4. Click "Simpan Pertandingan"
5. **Verify:** Ardo's row NOT visible in the match members list
6. **Verify:** Total amount only counts other 3 members

### Test 3: Check Database
```sql
SELECT 
  member_name,
  amount_due,
  attendance_fee,
  total_amount,
  payment_status
FROM match_members
WHERE member_name ILIKE 'Ardo'
ORDER BY created_at DESC
LIMIT 5;

-- Expected for all Ardo rows:
-- amount_due = 0
-- attendance_fee = 0
-- total_amount = 0
```

### Test 4: Login as Ardo
1. Login with Ardo's account
2. Navigate to Dashboard → Pembayaran
3. **Verify:** See VIP/Free Access card (purple gradient)
4. **Verify:** No payment buttons or upload UI
5. **Verify:** Message: "Anda memiliki akses gratis"

### Test 5: Admin Stats Exclude Ardo
1. Create 5 matches with Ardo + other members
2. Go to Admin → Pembayaran
3. Check "Total Pendapatan" stat card
4. **Verify:** Total does NOT include Ardo's Rp 0 amounts
5. **Verify:** Only non-exempt members counted

---

## How to Add More Exempt Members

```sql
-- Add another VIP member
UPDATE public.profiles
SET is_payment_exempt = true
WHERE LOWER(full_name) = 'vip-member-name';

-- Add multiple at once
UPDATE public.profiles
SET is_payment_exempt = true
WHERE LOWER(full_name) IN ('sponsor1', 'sponsor2', 'admin1');

-- View all exempt members
SELECT full_name, email, is_payment_exempt
FROM profiles
WHERE is_payment_exempt = true;
```

---

## How to Remove Exemption

```sql
-- Remove Ardo's exemption (return to normal payments)
UPDATE public.profiles
SET is_payment_exempt = false
WHERE LOWER(full_name) = 'ardo';

-- After removal, Ardo will:
-- ✅ Be visible in admin payment lists
-- ✅ Pay normal amounts in future matches
-- ✅ See normal payment dashboard
-- ❌ Past exempt matches remain Rp 0 (not retroactive)
```

---

## Important Notes

1. **Not Retroactive:** Setting `is_payment_exempt = true` only affects NEW matches created after the flag is set. Past matches are NOT updated automatically.

2. **Update Past Matches Manually:**
   ```sql
   -- If you want to zero out past pending matches
   UPDATE match_members
   SET amount_due = 0, attendance_fee = 0, total_amount = 0
   WHERE member_name ILIKE 'MemberName'
     AND payment_status = 'pending';
   ```

3. **Permanent Flag:** This is a permanent flag. Use carefully. Review before granting exemption.

4. **Admin Visibility:** Admins do NOT see exempt members in payment lists. This is intentional to keep recaps accurate.

5. **Member Dashboard:** Exempt members see ONLY the VIP card, no payment UI at all.

6. **Future Matches:** All future matches automatically set amounts to 0 for exempt members.

---

## Files Modified

1. **supabase-payment-exempt-feature.sql** (NEW)
   - Schema changes
   - Helper function
   - Initial Ardo setup

2. **src/app/api/matches/bulk-create/route.ts**
   - Check `is_payment_exempt` flag
   - Set amounts to 0 for exempt members

3. **src/app/admin/pembayaran/page.tsx**
   - Fetch exempt members list
   - Filter from display
   - Exclude from stats calculations

4. **src/app/dashboard/pembayaran/page.tsx**
   - Check if current user is exempt
   - Show VIP/Free Access card instead of payment UI

---

## FAQ

**Q: Can exempt members still see their match history?**
A: Exempt members see a special VIP card instead of payment UI. Their matches exist in the database but are not shown in payment lists.

**Q: What happens if I set exemption AFTER matches are created?**
A: Future matches will be free. Past matches remain paid status. Update manually with UPDATE query if needed.

**Q: Can I make someone exempt temporarily?**
A: Yes, just set `is_payment_exempt = false` when you want to remove the exemption. Future matches will charge normally.

**Q: Does exemption affect membership?**
A: Exempt members don't need membership. System marks them as "has_membership = true" to avoid attendance fee logic.

**Q: Can admins see exempt members in the match list?**
A: No, exempt members are filtered out from admin payment views to keep recaps accurate.

**Q: What if an exempt member pays accidentally?**
A: Unlikely because:
  1. Amounts are set to Rp 0
  2. Member dashboard shows no payment UI
  3. If somehow paid, admin can cancel/refund manually

---

## Summary

**Purpose:** Give Ardo (or other VIP/sponsors) permanent free access to play without payment requirements.

**Effect:**
- ✅ All amounts = Rp 0
- ✅ Excluded from payment recaps
- ✅ Special VIP dashboard UI
- ✅ Automatic handling in match creation

**Use Case:** Sponsors, admins, special guests, or anyone who should play for free.

**Maintenance:** Run SQL migration, set flag, done. Future matches automatically free.
