-- Add lengan column to pre_orders table
-- Run this script in Supabase SQL Editor

-- Add the lengan column if it doesn't exist
ALTER TABLE public.pre_orders 
ADD COLUMN IF NOT EXISTS lengan TEXT DEFAULT 'short';

-- Add check constraint for valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pre_orders_lengan_check'
    ) THEN
        ALTER TABLE public.pre_orders 
        ADD CONSTRAINT pre_orders_lengan_check 
        CHECK (lengan IN ('short', 'long'));
    END IF;
END $$;

-- Update any existing records to have default value
UPDATE public.pre_orders 
SET lengan = 'short' 
WHERE lengan IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'pre_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;