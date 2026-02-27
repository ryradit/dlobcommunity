# Payment Proof Rejection Implementation Guide

## ✅ Implementation Status

### Completed:
1. ✅ SQL Migration Created (`supabase-payment-rejection.sql`)
2. ✅ Admin Payment Page Updated with Rejection UI
3. ⏳ Member Payment Page (Needs completion)
4. ⏳ Testing Required

---

## 🗄️ Step 1: Run SQL Migration

**File:** `supabase-payment-rejection.sql`

Run this SQL in your Supabase SQL Editor to add rejection fields to both `match_members` and `memberships` tables.

**What it adds:**
- `rejection_reason` - Text field for rejection reason
- `rejection_date` - Timestamp of rejection
- `rejected_by` - Admin ID who rejected
- `submission_count` - Track resubmission attempts
- New statuses: `rejected` and `revision`
- Trigger to auto-increment submission count on resubmission
- Trigger to reset status from `rejected` to `pending` on new upload

---

## 🎨 Step 2: Admin Side (✅ COMPLETED)

### Features Added:
1. **Reject Button** in proof modal (red "Tolak" button)
2. **Rejection Reasons Modal** with predefined reasons:
   - Foto tidak jelas/buram
   - Jumlah transfer tidak sesuai
   - Rekening tujuan salah
   - Tanggal transfer tidak sesuai periode
   - Bukti palsu/di-edit
   - Lainnya (custom reason)

3. **Handler Function** (`handleRejectPayment`)
   - Updates payment status to `rejected`
   - Saves rejection reason
   - Records admin ID and timestamp
   - Refreshes payment list

### UI Flow:
Admin clicks proof → Modal shows → Click "Tolak" → Select reason → Click "Tolak Bukti" → Payment marked as rejected → Member notified

---

## 👤 Step 3: Member Side (⏳ IN PROGRESS)

### What Needs to be Done:

1. **Update Interfaces** in `/src/app/dashboard/pembayaran/page.tsx`:
```typescript
interface MatchMember {
  // ... existing fields
  rejection_reason?: string | null;
  rejection_date?: string | null;
}

interface Membership {
  // ... existing fields
  rejection_reason?: string | null;
  rejection_date?: string | null;
}
```

2. **Display Rejection Status** - Show red alert card when status is `rejected`:
```tsx
{match.payment_status === 'rejected' && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <h4 className="font-semibold text-red-400">Bukti Pembayaran Ditolak</h4>
    </div>
    <p className="text-sm text-red-300 mb-3">
      {match.rejection_reason}
    </p>
    <button
      onClick={() => {
        setSelectedPayment({
          id: match.id,
          type: 'match',
          amount: match.total_amount,
          matchNumber: match.matches.match_number
        });
        setShowUploadModal(true);
      }}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
    >
      Upload Ulang Bukti
    </button>
  </div>
)}
```

3. **Update Fetch Query** to include rejection fields:
```typescript
.select(`
  *,
  matches (
    match_number,
    created_at,
    shuttlecock_count
  ),
  rejection_reason,
  rejection_date
`)
```

4. **Allow Resubmission** - Update the condition that checks if upload button should show:
```typescript
{(match.payment_status === 'pending' || match.payment_status === 'rejected') && !match.payment_proof && (
  // Upload button
)}
```

---

## 🔄 Workflow

### Happy Path:
1. Member uploads proof → Status: `pending` with proof
2. Admin reviews → Clicks "Konfirmasi Pembayaran"
3. Status: `paid` ✅

### Rejection Path:
1. Member uploads proof → Status: `pending` with proof
2. Admin reviews → Clicks "Tolak" → Selects reason
3. Status: `rejected`, proof remains, reason saved
4. Member sees red alert with reason
5. Member clicks "Upload Ulang Bukti"
6. Member uploads new proof
7. Trigger automatically:
   - Status: `rejected` → `pending`
   - `submission_count` incremented
   - `rejection_reason` cleared
8. Back to step 2 (admin reviews again)

---

## 📊 Database Trigger Logic

The SQL trigger `log_payment_rejection()` automatically handles:

**On Rejection:**
- Sets `rejection_date` to NOW()
- Sets `rejected_by` to current admin

**On Resubmission:**
- Increments `submission_count`
- Changes status from `rejected` → `pending`
- Clears `rejection_reason`

---

## 🧪Step 4: Testing Checklist

After completing member side implementation:

### Admin Tests:
- [ ] Can view payment proof
- [ ] Can reject with predefined reason
- [ ] Can reject with custom reason
- [ ] Rejection saves correctly to database
- [ ] Proof modal closes after rejection

### Member Tests:
- [ ] Can see rejected payment with reason
- [ ] Red alert card displays properly
- [ ] "Upload Ulang" button works
- [ ] Can upload new proof
- [ ] Status changes back to pending
- [ ] submission_count increments

### Integration Tests:
- [ ] Full cycle: Upload → Reject → Reupload → Approve
- [ ] Multiple rejections (count tracking)
- [ ] Rejection on both match and membership payments

---

## 💡 Future Enhancements

1. **Email Notification** when proof rejected
2. **WhatsApp Alert** via API
3. **Rejection History Log** (show all rejections)
4. **Analytics Dashboard** (rejection rate, common reasons)
5. **Auto-suggest Reason** based on image analysis

---

## 📝 Notes

- Rejection does NOT delete the proof - it remains visible to admin
- Member can see their rejected proof and the reason
- `submission_count` helps track problematic cases
- Admin ID tracked for accountability

---

## 🚀 Next Steps

1. Run `supabase-payment-rejection.sql` in Supabase SQL Editor
2. Complete member side UI updates (see Step 3)
3. Test thoroughly with both admin and member accounts
4. Deploy and monitor
