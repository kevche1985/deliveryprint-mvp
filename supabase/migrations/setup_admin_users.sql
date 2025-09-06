-- First, let's check if we have the admin users in auth.users and create user profiles for them
-- We'll need to get the user IDs from auth.users and create corresponding profiles

-- Create admin user profile if it doesn't exist
-- Note: You'll need to replace the UUID with the actual user ID from auth.users
-- You can get this by running: SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- For now, let's create a function to help set up admin users
CREATE OR REPLACE FUNCTION setup_admin_user(user_email TEXT, user_role TEXT DEFAULT 'admin')
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NOT NULL THEN
        -- Insert or update user profile
        INSERT INTO user_profiles (
            id, 
            first_name, 
            last_name, 
            role, 
            status,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'Admin',
            'User',
            user_role::user_role_enum,
            'active'::account_status_enum,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = user_role::user_role_enum,
            status = 'active'::account_status_enum,
            updated_at = NOW();
            
        RAISE NOTICE 'User profile created/updated for %', user_email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users', user_email;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Set up admin users (if they exist in auth.users)
SELECT setup_admin_user('admin@example.com', 'admin');
SELECT setup_admin_user('operator@example.com', 'operator');

-- Clean up the function
DROP FUNCTION setup_admin_user(TEXT, TEXT);

-- Let's also make sure we have the proper enum types
DO $$ 
BEGIN
    -- Check if user_role_enum exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('admin', 'operator', 'customer', 'supplier');
    END IF;
    
    -- Check if account_status_enum exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum') THEN
        CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'pending');
    END IF;
END $$;

-- Update the user_profiles table to use proper enum types if not already done
DO $$
BEGIN
    -- Add role column with enum type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role user_role_enum NOT NULL DEFAULT 'customer';
    END IF;
    
    -- Add status column with enum type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN status account_status_enum NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Show current admin users for verification
SELECT 
    up.id,
    au.email,
    up.first_name,
    up.last_name,
    up.role,
    up.status,
    up.created_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role IN ('admin', 'operator')
ORDER BY up.role, au.email;
