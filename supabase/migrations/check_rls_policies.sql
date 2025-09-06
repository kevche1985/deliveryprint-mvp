-- Check RLS policies on digital_products table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'digital_products';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'digital_products';

-- Check current user and auth status
SELECT 
    current_user as current_db_user,
    session_user as session_db_user;

-- Test if we can insert a simple record (this will help identify the exact constraint issue)
-- First, let's see what users exist in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
