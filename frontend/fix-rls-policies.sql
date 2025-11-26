-- Fix RLS policies for pre_orders table
-- Run this script in Supabase SQL Editor

-- First, let's see current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pre_orders';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow public insert for pre_orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Allow authenticated users to view pre_orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update pre_orders" ON public.pre_orders;

-- Create a simple public insert policy that allows anyone to insert
CREATE POLICY "Enable insert for everyone" ON public.pre_orders
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Create policy for authenticated users to view all records
CREATE POLICY "Enable read for authenticated users" ON public.pre_orders
    FOR SELECT 
    TO authenticated
    USING (true);

-- Create policy for authenticated users to update records
CREATE POLICY "Enable update for authenticated users" ON public.pre_orders
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pre_orders';