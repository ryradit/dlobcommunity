# 💰 Keuangan Feature - Quick Setup Guide

## ⚠️ Database Setup Required

Before using the Keuangan feature, you need to run the SQL migration in Supabase.

---

## 🚀 Setup Steps (5 minutes)

### **Step 1: Open Supabase SQL Editor**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **dlobcommunity**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

### **Step 2: Run the Migration**

1. Open the file: `supabase-keuangan.sql`
2. **Copy ALL the SQL code** (153 lines)
3. **Paste** into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

**Expected result:**
```
Success. No rows returned
```

---

### **Step 3: Verify Installation**

Run this test query in SQL Editor:

```sql
-- Test: Get current month summary
SELECT * FROM get_monthly_keuangan(CURRENT_DATE);
```

**Expected result:**
A table with columns:
- `total_pendapatan`
- `total_pengeluaran`
- `keuntungan`
- `pengeluaran_sewa`
- `pengeluaran_shuttlecock`
- `pengeluaran_lainnya`

All values will be 0 if no data exists yet. **This is normal!**

---

### **Step 4: Test the Page**

1. Refresh the Keuangan page in your app
2. You should now see:
   - Three summary cards (all showing Rp 0)
   - Empty expense table (no data yet)
   - Tutorial overlay (first visit)

---

## ✅ You're Ready!

Now you can:
- Click "Tambah Pengeluaran" to add expenses
- View automatic revenue calculation from Pembayaran
- See real-time profit calculation

---

## 🔍 What Was Created

### **Database Table: `pengeluaran`**
Stores all operational expenses:
- Court rent (Sewa Lapangan)
- Shuttlecock purchases
- Other expenses (maintenance, marketing, etc.)

### **Database Function: `get_monthly_keuangan()`**
Auto-calculates:
- **Pendapatan** = Sum of confirmed payments this month
- **Pengeluaran** = Sum of all expenses this month
- **Keuntungan** = Pendapatan - Pengeluaran

### **RLS Policies**
- Only admins can view/add/edit/delete expenses
- Members cannot access this data

---

## 📊 How Revenue is Calculated

```sql
Pendapatan (Revenue) = 
  SUM(total_amount) 
  FROM match_members 
  WHERE payment_status = 'confirmed' 
  AND payment_date in current month
```

This pulls from your existing Pembayaran data automatically!

---

## 🛠️ Troubleshooting

### **Error: "function get_monthly_keuangan() does not exist"**
➡️ You haven't run the SQL migration yet. Go back to Step 2.

### **Error: "relation pengeluaran does not exist"**
➡️ Same as above. Run the full migration.

### **Revenue shows Rp 0 but you have payments**
➡️ Check that payments are:
1. Status = 'confirmed' (not pending/rejected)
2. Have a payment_date in current month
3. In the match_members table

### **Can't add expenses**
➡️ Check you're logged in as admin (not viewing as member)

---

## 📝 Quick Test Data

Want to see how it looks with data? Add test expenses:

```sql
-- Add court rent
INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
VALUES (
  'court_rent', 
  'Sewa Lapangan Februari', 
  2500000, 
  '2026-02-01', 
  'Bayar sewa bulan Feb',
  auth.uid()
);

-- Add shuttlecock purchase
INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
VALUES (
  'shuttlecock',
  'Beli Shuttlecock 20 tube',
  300000,
  '2026-02-15',
  'Stok shuttlecock',
  auth.uid()
);

-- Add other expense
INSERT INTO public.pengeluaran (category, nama, jumlah, tanggal, catatan, created_by)
VALUES (
  'others',
  'Perbaikan Net Court A',
  150000,
  '2026-02-20',
  'Net rusak',
  auth.uid()
);
```

Refresh the page and you'll see:
- Pengeluaran: Rp 2,950,000
- Three expenses in the table
- Profit calculation (if you have confirmed payments)

---

## 🎯 Next Steps

1. ✅ Run SQL migration
2. ✅ Test the page
3. ✅ Add your real expenses
4. ✅ Watch profit calculations update automatically

**All set!** 🚀
