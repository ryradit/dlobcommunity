-- Add XS size to pre_orders table CHECK constraint
-- This script updates the existing pre_orders table to support XS size

-- Step 1: Drop the existing CHECK constraint on ukuran
ALTER TABLE public.pre_orders DROP CONSTRAINT IF EXISTS pre_orders_ukuran_check;

-- Step 2: Add the new CHECK constraint that includes XS
ALTER TABLE public.pre_orders
  ADD CONSTRAINT pre_orders_ukuran_check 
  CHECK (ukuran IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'));

-- Verify the constraint was added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'pre_orders' AND constraint_name LIKE 'pre_orders_ukuran%';
