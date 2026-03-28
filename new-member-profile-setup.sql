-- ==============================================
-- MEMBER CREATION: Simple member_id setup
-- ==============================================
-- This ensures every member has a profile entry
-- so matches can be linked via member_id

-- Create trigger function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    user_id,
    email
  )
  VALUES (
    NEW.id,
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- Verify trigger was created
SELECT 'Trigger created successfully' as status;
