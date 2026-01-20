# Fix Pre-Order XS Size Error

## Issue
When trying to submit a pre-order form with XS size, you get:
```
Failed to save pre-order
```

The error is: **new row for relation "pre_orders" violates check constraint "pre_orders_ukuran_check"**

## Root Cause
The Supabase database table `pre_orders` has a CHECK constraint that only allows sizes: 'S', 'M', 'L', 'XL', 'XXL', '3XL'

The application code was updated to support 'XS', but the database constraint wasn't updated.

## Solution - Update Supabase Database

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### Step 2: Update the Constraint
4. Click "+ New Query"
5. **Copy and paste this SQL exactly:**

```sql
ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;

ALTER TABLE public.pre_orders ADD CONSTRAINT pre_orders_ukuran_check CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));
```

6. Click "Run" or press Ctrl+Enter
7. You should see: **Success** message

### Step 3: Verify
7. You can optionally verify by running this query:

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pre_orders' AND constraint_name LIKE '%ukuran%';
```

You should see `pre_orders_ukuran_check` listed.

## After Updating Database
1. Return to the pre-order form
2. The XS size option should now work
3. You can select XS and submit the form successfully

## What Was Changed in the Code

**Frontend (page.tsx):**
- Added 'XS' to size options dropdown
- Added XS measurements (65cm height, 45cm width) to size guide
- XS pricing: Rp 110,000 (same as S-XL)

**API (route.ts):**
- Validation updated to accept 'XS'
- Price calculation handles XS

**Database schema file (create-pre-orders-table.sql):**
- Constraint definition updated (for future deployments)

**Only the live database constraint is blocking submissions.**

---

**Need help?** Run this to verify connectivity:
```bash
node database/deploy-xs-size.js
```

This will test the connection and tell you if XS is supported or not.
