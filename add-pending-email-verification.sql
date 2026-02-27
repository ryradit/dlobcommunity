-- Add pending_email_verification column to profiles table
-- This flag is set to TRUE when a user changes from temp email to real email
-- and is cleared after the email is verified

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pending_email_verification BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN profiles.pending_email_verification IS 'Set to TRUE when user changes email and needs to verify. Blocks login until verified.';

-- Update any existing users who might have unverified emails
-- (This is optional - only run if you want to force re-verification for existing users)
-- UPDATE profiles 
-- SET pending_email_verification = TRUE 
-- WHERE using_temp_email = FALSE 
-- AND must_change_password = FALSE 
-- AND email NOT LIKE '%@temp.dlob.local';
