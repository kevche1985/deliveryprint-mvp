-- =====================================================
-- HARD DELETE USER SCRIPT
-- =====================================================
-- WARNING: This script performs IRREVERSIBLE hard deletes
-- Use with extreme caution in production environments
-- =====================================================

-- Function to hard delete a user and all related data
CREATE OR REPLACE FUNCTION hard_delete_user(target_user_id UUID)
RETURNS TABLE (
    operation TEXT,
    table_name TEXT,
    records_deleted INTEGER,
    status TEXT
) AS $$
DECLARE
    user_email TEXT;
    user_exists BOOLEAN := FALSE;
    delete_count INTEGER;
BEGIN
    -- Check if user exists and get email for logging
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF user_email IS NOT NULL THEN
        user_exists := TRUE;
        RETURN QUERY SELECT 'VALIDATION'::TEXT, 'auth.users'::TEXT, 0, 
                           ('User found: ' || user_email)::TEXT;
    ELSE
        RETURN QUERY SELECT 'ERROR'::TEXT, 'auth.users'::TEXT, 0, 
                           'User not found with ID: ' || target_user_id::TEXT;
        RETURN;
    END IF;

    -- Start deletion process in dependency order
    -- Delete from tables that reference other user-related tables first
    
    -- 1. Delete ticket responses
    DELETE FROM ticket_responses WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'ticket_responses'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 2. Delete quote items (via quotes)
    DELETE FROM quote_items WHERE quote_id IN (
        SELECT id FROM quotes WHERE customer_id = target_user_id OR created_by = target_user_id
    );
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'quote_items'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 3. Delete quote history (if exists)
    DELETE FROM quote_history WHERE quote_id IN (
        SELECT id FROM quotes WHERE customer_id = target_user_id OR created_by = target_user_id
    );
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'quote_history'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 4. Delete quote communications (if exists)
    DELETE FROM quote_communications WHERE quote_id IN (
        SELECT id FROM quotes WHERE customer_id = target_user_id OR created_by = target_user_id
    );
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'quote_communications'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 5. Delete order items (via orders)
    DELETE FROM order_items WHERE order_id IN (
        SELECT id FROM orders WHERE user_id = target_user_id
    );
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'order_items'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 6. Delete cart items
    DELETE FROM cart_items WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'cart_items'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 7. Delete digital downloads
    DELETE FROM digital_downloads WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'digital_downloads'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 8. Delete digital products
    DELETE FROM digital_products WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'digital_products'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 9. Delete designs
    DELETE FROM designs WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'designs'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 10. Delete support tickets
    DELETE FROM support_tickets WHERE customer_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'support_tickets'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 11. Delete quotes
    DELETE FROM quotes WHERE customer_id = target_user_id OR created_by = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'quotes'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 12. Delete orders
    DELETE FROM orders WHERE user_id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'orders'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 13. Delete user profile (this should cascade due to ON DELETE CASCADE)
    DELETE FROM user_profiles WHERE id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'user_profiles'::TEXT, delete_count, 'SUCCESS'::TEXT;
    
    -- 14. Finally, delete from auth.users (this is the main user record)
    DELETE FROM auth.users WHERE id = target_user_id;
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RETURN QUERY SELECT 'DELETE'::TEXT, 'auth.users'::TEXT, delete_count, 
                       ('User ' || user_email || ' completely deleted')::TEXT;
    
    -- Final confirmation
    RETURN QUERY SELECT 'COMPLETE'::TEXT, 'ALL_TABLES'::TEXT, 0, 
                       ('Hard delete completed for user: ' || user_email)::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 'ERROR'::TEXT, 'EXCEPTION'::TEXT, 0, 
                           ('Error during deletion: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BULK DELETE FUNCTION
-- =====================================================
-- Function to delete multiple users by email pattern or role
CREATE OR REPLACE FUNCTION hard_delete_users_bulk(
    email_pattern TEXT DEFAULT NULL,
    user_role TEXT DEFAULT NULL,
    confirm_deletion BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    operation TEXT,
    table_name TEXT,
    records_deleted INTEGER,
    status TEXT
) AS $$
DECLARE
    user_record RECORD;
    result_record RECORD;
BEGIN
    -- Safety check
    IF NOT confirm_deletion THEN
        RETURN QUERY SELECT NULL::UUID, ''::TEXT, 'ERROR'::TEXT, 'SAFETY_CHECK'::TEXT, 0, 
                           'Must set confirm_deletion = TRUE to proceed'::TEXT;
        RETURN;
    END IF;
    
    -- Build user selection query
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN user_profiles up ON au.id = up.id
        WHERE (email_pattern IS NULL OR au.email ILIKE email_pattern)
        AND (user_role IS NULL OR up.role = user_role::user_role_enum)
        AND au.email NOT IN ('admin@example.com', 'operator@example.com') -- Protect system accounts
    LOOP
        -- Delete each user and return results
        FOR result_record IN 
            SELECT * FROM hard_delete_user(user_record.id)
        LOOP
            RETURN QUERY SELECT user_record.id, user_record.email, 
                               result_record.operation, result_record.table_name,
                               result_record.records_deleted, result_record.status;
        END LOOP;
    END LOOP;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, ''::TEXT, 'INFO'::TEXT, 'NO_USERS'::TEXT, 0, 
                           'No users found matching criteria'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Delete a specific user by ID
-- SELECT * FROM hard_delete_user('user-uuid-here');

-- Example 2: Delete all test users (emails containing 'test')
-- SELECT * FROM hard_delete_users_bulk('%test%', NULL, TRUE);

-- Example 3: Delete all customers
-- SELECT * FROM hard_delete_users_bulk(NULL, 'customer', TRUE);

-- Example 4: Preview users that would be deleted (without actually deleting)
-- SELECT au.id, au.email, up.role, up.status
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.id
-- WHERE au.email ILIKE '%test%'
-- AND au.email NOT IN ('admin@example.com', 'operator@example.com');

-- =====================================================
-- SAFETY COMMANDS
-- =====================================================

-- Check user count before deletion
-- SELECT 
--     up.role,
--     COUNT(*) as user_count
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.id
-- GROUP BY up.role
-- ORDER BY up.role;

-- Backup user data before deletion (recommended)
-- CREATE TABLE user_backup_YYYYMMDD AS
-- SELECT au.*, up.first_name, up.last_name, up.role, up.status
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.id;