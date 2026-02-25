## 💰 OPEX Configuration Guide

This guide explains how to configure and manage Operational Expenses (OPEX) for the financial dashboard.

---

## 📊 **Three Types of OPEX**

### 1. **Fixed OPEX** (Configured Once)
Recurring monthly costs that don't change.

**Examples:**
- Court rent: Rp 2,500,000/month
- Base utilities: Rp 300,000/month
- Insurance: Rp 200,000/month
- Staff salary: Rp 1,500,000/month

**How to configure:**
```sql
-- In Supabase SQL Editor, run:
INSERT INTO public.opex_config (category, name, amount, recurrence, notes)
VALUES ('court_rent', 'Sewa Lapangan Bulanan', 2500000, 'monthly', 'Fixed monthly cost');
```

**Admin UI:**
- Go to Admin → Keuangan → OPEX Settings
- Section: "Biaya Tetap (Fixed)"
- Click "Tambah Biaya Tetap"
- Fill form and save
- ✅ Auto-calculated every month

---

### 2. **Variable OPEX** (Auto-Calculated)
Costs that depend on activity/usage.

**Examples:**
- Shuttlecock costs = Number of matches × Rp 15,000
- Extra electricity = Court hours used × Rp 5,000/hour

**How it works:**
- System counts matches played each month
- Multiplies by configured unit cost
- Auto-calculates total

**Configuration:**
```sql
INSERT INTO public.opex_variable_config (category, name, calculation_method, unit_cost)
VALUES ('shuttle_cost', 'Biaya Shuttlecock', 'per_match', 15000);
```

**Admin UI:**
- Section: "Biaya Variabel (Auto)"
- Shows: "80 matches × Rp 15,000 = Rp 1,200,000"
- Can adjust unit cost if prices change

---

### 3. **Manual OPEX** (Ad-hoc Entries)
One-time or irregular expenses entered as they occur.

**Examples:**
- Maintenance: Net replacement Rp 350,000
- Marketing: Instagram ads Rp 500,000
- Equipment: New rackets Rp 1,200,000
- Misc: Court cleaning Rp 200,000

**How to add:**

**Via Admin UI:**
1. Go to Admin → Keuangan → OPEX
2. Click "Tambah Pengeluaran Manual"
3. Fill form:
   - Category: Maintenance / Marketing / Equipment / Misc
   - Name: "Perbaikan Net Court B"
   - Amount: Rp 350,000
   - Date: 23 Feb 2026
   - Notes: "Net rusak, perlu ganti"
   - Upload receipt (optional)
4. Save ✅

**Via SQL:**
```sql
INSERT INTO public.opex_manual (category, name, amount, expense_date, notes, created_by)
VALUES (
  'maintenance',
  'Perbaikan Net Court B',
  350000,
  '2026-02-23',
  'Net rusak, perlu ganti',
  auth.uid()
);
```

---

## 🎯 **Complete Monthly OPEX Example**

### February 2026:

#### Fixed OPEX (Auto):
- Sewa Lapangan: Rp 2,500,000
- Listrik & Air (Base): Rp 300,000
- Asuransi: Rp 200,000
- Gaji Staff: Rp 1,500,000
**Subtotal: Rp 4,500,000**

#### Variable OPEX (Auto-calculated):
- Shuttlecock: 85 matches × Rp 15,000 = Rp 1,275,000
- Listrik Tambahan: 170 hours × Rp 5,000 = Rp 850,000
**Subtotal: Rp 2,125,000**

#### Manual OPEX (Entered by admin):
- Perbaikan Net Court B: Rp 350,000 (23 Feb)
- Instagram Ads: Rp 500,000 (15 Feb)
- Beli Raket Baru (2): Rp 800,000 (10 Feb)
- Deep Cleaning: Rp 300,000 (5 Feb)
**Subtotal: Rp 1,950,000**

### **TOTAL OPEX: Rp 8,575,000**

---

## 🛠️ **Admin Workflow**

### **Monthly Setup (First Time Only)**
1. Configure fixed OPEX (court rent, utilities, etc.)
2. Configure variable OPEX rules (shuttle cost per match)
3. Done! These auto-calculate every month

### **Ongoing (As Needed)**
1. When you pay for something (maintenance, marketing, etc.):
   - Go to Keuangan → Tambah Pengeluaran
   - Fill details
   - Upload receipt
   - Save
2. System auto-tracks everything else

### **Month End**
1. View financial dashboard
2. See complete OPEX breakdown
3. AI analyzes and gives insights
4. Export report if needed

---

## 📈 **How OPEX is Calculated in Dashboard**

```typescript
// Automatic calculation
Fixed OPEX:        Rp 4,500,000  (from opex_config)
+ Variable OPEX:   Rp 2,125,000  (auto-calculated from matches)
+ Manual OPEX:     Rp 1,950,000  (from opex_manual)
= TOTAL OPEX:      Rp 8,575,000

Revenue:          Rp 15,450,000  (from payment confirmations)
- OPEX:           Rp 8,575,000
= NET PROFIT:     Rp 6,875,000  ✅
```

---

## 🤖 **AI Features for OPEX**

### 1. Anomaly Detection
```
⚠️ AI Alert:
"Shuttle cost naik 45% bulan ini (Rp 1.9M vs avg Rp 1.3M)
Possible reasons:
- Supplier price increase?
- More matches than usual? (check: 85 vs avg 73)
- Quality issue? (shuttles not lasting as long?)"
```

### 2. Cost Optimization
```
💡 AI Suggestion:
"Current shuttle: Brand A @ Rp 15k/tube
Alternative: Brand C @ Rp 18k/tube but lasts 1.8x longer
Net savings: Rp 400k/month (26% cost reduction)
Switch to Brand C?"
```

### 3. Budget Alerts
```
📊 AI Forecast:
"Based on current spending rate:
- OPEX will reach Rp 8.8M by month end
- Budget: Rp 8M (10% over)
Recommendation: Delay non-urgent maintenance to next month"
```

---

## 🎨 **Admin UI Preview**

```
┌──────────────────────────────────────────┐
│ 💰 KELOLA OPEX                           │
├──────────────────────────────────────────┤
│                                          │
│ 📌 BIAYA TETAP (Auto)                    │
│ ┌────────────────────────────────────┐   │
│ │ Sewa Lapangan    Rp 2,500,000  [✏️] │   │
│ │ Listrik & Air    Rp 300,000    [✏️] │   │
│ │ Gaji Staff       Rp 1,500,000  [✏️] │   │
│ └────────────────────────────────────┘   │
│ [+ Tambah Biaya Tetap]                   │
│                                          │
│ 🔄 BIAYA VARIABEL (Auto-hitung)          │
│ ┌────────────────────────────────────┐   │
│ │ Shuttlecock                        │   │
│ │ 85 matches × Rp 15,000             │   │
│ │ = Rp 1,275,000              [⚙️]   │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ✏️ PENGELUARAN MANUAL                    │
│ [+ Tambah Pengeluaran]                   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ 23 Feb  Perbaikan Net  Rp 350,000  │   │
│ │ 15 Feb  Instagram Ads  Rp 500,000  │   │
│ │ 10 Feb  Beli Raket     Rp 800,000  │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ═══════════════════════════════════════  │
│ TOTAL OPEX BULAN INI: Rp 8,575,000       │
│ ═══════════════════════════════════════  │
└──────────────────────────────────────────┘
```

---

## ✅ **Advantages of This System**

1. **Minimal Manual Work**
   - Fixed costs configured once
   - Variable costs auto-calculated
   - Only enter ad-hoc expenses

2. **Accurate Tracking**
   - Shuttle costs tied to actual matches
   - No guessing or estimates
   - Complete expense history

3. **Flexible**
   - Easy to add new OPEX categories
   - Adjust unit costs anytime
   - Handle one-time expenses

4. **AI-Ready**
   - Clean data structure
   - Historical tracking
   - Perfect for AI analysis

5. **Admin-Friendly**
   - Simple forms
   - Receipt uploads
   - Quick entry

---

## 🚀 **Next Steps**

1. **Run SQL migration:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase-financial-opex.sql
   ```

2. **Configure initial fixed OPEX**
   (Your monthly recurring costs)

3. **Set variable cost rules**
   (Shuttle cost per match, etc.)

4. **Start adding manual expenses**
   (As they occur)

5. **View dashboard next month**
   (Complete financial picture!)

---

**Questions?** The system is flexible - start simple and expand as needed! 🎯
