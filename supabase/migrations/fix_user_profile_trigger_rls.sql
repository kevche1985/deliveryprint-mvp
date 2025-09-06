-- Fix RLS policy to allow trigger function to create user profiles

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create a new policy that allows both user self-insertion and trigger insertion
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    -- Allow users to insert their own profile
    auth.uid() = id 
    OR 
    -- Allow trigger function to insert profiles (when auth.uid() is null during signup)
    auth.uid() IS NULL
  );

-- Alternative: Create a separate policy specifically for the trigger
CREATE POLICY "Trigger can create user profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    -- Allow when there's no authentication context (trigger execution)
    auth.uid() IS NULL
  );