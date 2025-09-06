-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role user_role_enum := 'customer';
    first_name_val VARCHAR(50) := 'User';
    last_name_val VARCHAR(50) := 'User';
BEGIN
    -- Extract role from user metadata if provided
    IF NEW.raw_user_meta_data ? 'role' THEN
        user_role := (NEW.raw_user_meta_data->>'role')::user_role_enum;
    END IF;
    
    -- Extract first_name from metadata if provided
    IF NEW.raw_user_meta_data ? 'first_name' THEN
        first_name_val := NEW.raw_user_meta_data->>'first_name';
    END IF;
    
    -- Extract last_name from metadata if provided
    IF NEW.raw_user_meta_data ? 'last_name' THEN
        last_name_val := NEW.raw_user_meta_data->>'last_name';
    END IF;
    
    -- Set role based on email for admin/operator accounts
    IF NEW.email = 'admin@example.com' THEN
        user_role := 'admin';
        first_name_val := 'Admin';
    ELSIF NEW.email = 'operator@example.com' THEN
        user_role := 'operator';
        first_name_val := 'Operator';
    END IF;
    
    -- Insert user profile
    INSERT INTO public.user_profiles (
        id,
        first_name,
        last_name,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        first_name_val,
        last_name_val,
        user_role,
        'active'::account_status_enum,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Backfill user profiles for existing users who don't have profiles
INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    role,
    status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    CASE 
        WHEN au.email = 'admin@example.com' THEN 'Admin'
        WHEN au.email = 'operator@example.com' THEN 'Operator'
        WHEN au.raw_user_meta_data ? 'first_name' THEN au.raw_user_meta_data->>'first_name'
        ELSE 'User'
    END as first_name,
    CASE 
        WHEN au.raw_user_meta_data ? 'last_name' THEN au.raw_user_meta_data->>'last_name'
        ELSE 'User'
    END as last_name,
    CASE 
        WHEN au.email = 'admin@example.com' THEN 'admin'::user_role_enum
        WHEN au.email = 'operator@example.com' THEN 'operator'::user_role_enum
        WHEN au.raw_user_meta_data ? 'role' THEN (au.raw_user_meta_data->>'role')::user_role_enum
        ELSE 'customer'::user_role_enum
    END as role,
    'active'::account_status_enum as status,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;