-- Add last_dashboard_visit column to profiles table
-- This tracks when a user last visited their dashboard to differentiate first-time vs returning logins

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_dashboard_visit TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN profiles.last_dashboard_visit IS 'Last time user visited their dashboard - used to show "Welcome" vs "Welcome back" message';
