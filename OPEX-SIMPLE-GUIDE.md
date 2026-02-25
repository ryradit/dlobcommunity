## 💰 OPEX Configuration - SIMPLIFIED

Your OPEX structure is simple - only 2 main categories:

---

## 📊 **OPEX Breakdown**

### 1. **Court Rent** (Fixed - Rp 2,500,000/month)
- **Type:** Fixed monthly cost
- **Configuration:** Set once, auto-calculated every month
- **How to configure:**
  ```sql
  -- In Supabase SQL Editor:
  UPDATE public.opex_config 
  SET amount = 2500000  -- Change to your actual rent
  WHERE category = 'court_rent';
  ```

### 2. **Shuttlecock Purchase** (Variable - Based on matches)
- **Type:** Variable cost (depends on usage)
- **Calculation:** Number of matches × Rp 15,000 per tube
- **Example:** 85 matches × Rp 15,000 = Rp 1,275,000
- **How to configure:**
  ```sql
  -- Adjust price per tube if needed:
  UPDATE public.opex_variable_config 
  SET unit_cost = 15000  -- Change to actual cost per tube
  WHERE category = 'shuttle_cost';
  ```

---

## 📈 **Monthly OPEX Example**

### **February 2026:**

```
┌──────────────────────────────────────┐
│ 💸 TOTAL OPEX                        │
├──────────────────────────────────────┤
│                                      │
│ 📌 Sewa Lapangan (Fixed)             │
│    Rp 2,500,000                      │
│                                      │
│ 🏸 Shuttlecock (Variable)            │
│    85 matches × Rp 15,000            │
│    = Rp 1,275,000                    │
│                                      │
│ ═══════════════════════════════════  │
│ TOTAL: Rp 3,775,000                  │
│ ═══════════════════════════════════  │
└──────────────────────────────────────┘
```

---

## ✅ **100% Automatic Calculation**

**NO manual entry needed!**
- ✅ Court rent: Auto-added every month
- ✅ Shuttlecock cost: Auto-calculated from matches
- ✅ Total OPEX: Auto-summed

**Just set it up once, and forget it!**

---

## 🛠️ **Setup Steps**

### **Step 1: Run SQL Migration**
```bash
# In Supabase SQL Editor, execute:
supabase-financial-opex.sql
```

### **Step 2: Verify Configuration**
```sql
-- Check court rent setting:
SELECT * FROM opex_config WHERE category = 'court_rent';

-- Check shuttlecock cost per match:
SELECT * FROM opex_variable_config WHERE category = 'shuttle_cost';
```

### **Step 3: Adjust if Needed**
```sql
-- If your court rent is different:
UPDATE opex_config 
SET amount = 3000000  -- Your actual rent
WHERE category = 'court_rent';

-- If shuttlecock price changed:
UPDATE opex_variable_config 
SET unit_cost = 18000  -- New price per tube
WHERE category = 'shuttle_cost';
```

### **Step 4: Done!** ✅
OPEX now auto-calculates every month based on:
- Your fixed rent amount
- Actual number of matches played

---

## 📊 **View Your OPEX**

### **Get Current Month:**
```sql
SELECT * FROM calculate_monthly_opex(CURRENT_DATE);
```

**Result:**
```
category  | subcategory              | amount      | source
----------|--------------------------|-------------|------------
Fixed     | Sewa Lapangan Bulanan   | 2,500,000   | config
Variable  | Pembelian Shuttlecock   | 1,275,000   | calculated
```

### **Get Total:**
```sql
SELECT SUM(amount) as total_opex 
FROM calculate_monthly_opex(CURRENT_DATE);

-- Result: Rp 3,775,000
```

### **Last 6 Months Trend:**
```sql
SELECT 
  TO_CHAR(month, 'Mon YYYY') as bulan,
  SUM(amount) as total_opex
FROM (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '5 months',
    CURRENT_DATE,
    INTERVAL '1 month'
  ) as month
) months
CROSS JOIN LATERAL calculate_monthly_opex(month)
GROUP BY month
ORDER BY month DESC;
```

**Result:**
```
bulan     | total_opex
----------|------------
Feb 2026  | 3,775,000  (85 matches)
Jan 2026  | 3,650,000  (75 matches)
Dec 2025  | 4,100,000  (105 matches - holiday peak)
```

---

## 🤖 **AI Insights (What AI Can Tell You)**

```
💡 AI Analysis:

"February OPEX: Rp 3,775,000

✅ GOOD:
- Court rent stable (predictable)
- Shuttlecock efficiency: 1 tube per match (industry standard)
- Total OPEX reasonable for 85 matches

📊 TRENDS:
- Match volume +13% vs last month (75 → 85)
- Shuttlecock cost +Rp 150k (more matches = more shuttles)
- Cost per match: Rp 44,400 (down from Rp 48,700)

💰 EFFICIENCY:
- Revenue per match: Rp 140,000 (4 players × Rp 35k)
- OPEX per match: Rp 44,400
- Profit margin: 68% ✅ HEALTHY

⚠️ WATCH:
- Shuttlecock price stable at Rp 15k/tube?
- Consider bulk purchase discount for Feb peak season

🎯 FORECAST:
- March: ~90 matches expected
- OPEX projection: Rp 3,850,000
- If volume grows, consider negotiating court rent discount"
```

---

## 🚀 **Financial Dashboard Integration**

Your Keuangan page will show:

```typescript
┌────────────────────────────────────────┐
│ 💰 KEUANGAN - February 2026            │
├────────────────────────────────────────┤
│                                        │
│ REVENUE (from payments)                │
│ Total: Rp 11,900,000                   │
│   - Court bookings: Rp 11,900,000      │
│                                        │
│ OPEX (automatic)                       │
│ Total: Rp 3,775,000                    │
│   - Court rent: Rp 2,500,000 (66%)     │
│   - Shuttlecocks: Rp 1,275,000 (34%)   │
│                                        │
│ ════════════════════════════════════   │
│ NET PROFIT                              │
│ Rp 8,125,000 (68% margin) 🎉           │
│ ════════════════════════════════════   │
│                                        │
│ 📊 vs Last Month: +15%                 │
│ 🤖 AI Insight: "Healthy growth!"       │
└────────────────────────────────────────┘
```

---

## ✨ **That's It!**

Super simple:
1. ✅ Court rent: Fixed amount (configure once)
2. ✅ Shuttlecocks: Auto-calculated (matches × price)
3. ✅ Total OPEX: Always accurate, no manual work

**Questions?** Everything is automatic once configured! 🎯
