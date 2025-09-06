-- Fix infinite recursion in user_profiles RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Create new policies that don't cause recursion
-- Option 1: Use a function that bypasses RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new admin policies using the function
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (is_admin(auth.uid()));