-- Fix RLS policies for member creation
-- This allows the API to create new members without authentication

-- First, drop the existing restrictive member insert policy
DROP POLICY IF EXISTS "Members can insert their own profile" ON members;

-- Create a more permissive policy for member insertion
-- This allows anyone to create new members (needed for admin member creation)
CREATE POLICY "Allow member creation" ON members FOR INSERT 
WITH CHECK (true);

-- Alternative: If you want to be more restrictive, you can check for specific conditions
-- CREATE POLICY "Allow member creation with email" ON members FOR INSERT 
-- WITH CHECK (email IS NOT NULL AND name IS NOT NULL);

-- Also ensure that the members table allows public access for reading active members
-- This might already exist, but let's make sure
DROP POLICY IF EXISTS "Members can view active members" ON members;
CREATE POLICY "Public can view active members" ON members FOR SELECT 
USING (is_active = true);

-- Note: This is a temporary solution for development
-- In production, you should implement proper authentication and use service keys