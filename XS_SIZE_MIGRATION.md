# XS Size Support - Database Migration

## Problem
The pre-order form has been updated to support XS size, but the Supabase database table still has a CHECK constraint that only allows 'S', 'M', 'L', 'XL', 'XXL', '3XL'.

When trying to submit a pre-order with XS size, you get the error:
```
new row for relation "pre_orders" violates check constraint "pre_orders_ukuran_check"
```

## Solution
You need to update the CHECK constraint in your Supabase database.

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "+ New Query"
5. Copy and paste the following SQL:

```sql
-- Drop the existing CHECK constraint
ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;

-- Add the new CHECK constraint that includes XS
ALTER TABLE public.pre_orders
  ADD CONSTRAINT pre_orders_ukuran_check 
  CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));
```

6. Click "Run" (or press Ctrl+Enter)
7. You should see a success message

### Method 2: Using psql Command Line

If you have psql installed and your Supabase connection details:

```bash
psql "postgresql://postgres.[PROJECT-ID]:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" -c "
ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;
ALTER TABLE public.pre_orders
  ADD CONSTRAINT pre_orders_ukuran_check 
  CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));
"
```

## Verification

After running the migration, you can verify it worked by:

1. In Supabase SQL Editor, run:
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pre_orders';
```

You should see `pre_orders_ukuran_check` in the results.

2. Or try submitting the pre-order form with XS size - it should now work!

## Files Modified

- `frontend/src/app/pre-order/page.tsx` - Added XS to ukuranOptions, sizeGuide, and getSizePrice
- `frontend/src/app/api/pre-orders/route.ts` - Added XS to validSizes and getSizePrice
- `database/create-pre-orders-table.sql` - Updated CHECK constraint definition (for future deployments)
- `database/add-xs-size.sql` - Migration SQL file
- `database/deploy-xs-size.js` - Node script to automate migration (requires RPC setup)
