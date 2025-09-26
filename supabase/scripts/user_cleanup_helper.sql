-- =====================================================
-- USER CLEANUP HELPER SCRIPT
-- =====================================================
-- This script provides safe utilities for user management
-- and cleanup operations with comprehensive safety checks
-- =====================================================

-- Function to preview user data before deletion
CREATE OR REPLACE FUNCTION preview_user_deletion(target_user_id UUID)
RETURNS TABLE (
    table_name TEXT,
    record_count INTEGER,
    sample_data TEXT
) AS $$
BEGIN
    -- User profile info
    RETURN QUERY 
    SELECT 'user_profiles'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE(string_agg(first_name || ' ' || last_name || ' (' || role || ')', ', '), 'No records')::TEXT
    FROM user_profiles WHERE id = target_user_id;
    
    -- Orders
    RETURN QUERY 
    SELECT 'orders'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Order IDs: ' || string_agg(id::TEXT, ', '), 'No records')::TEXT
    FROM orders WHERE user_id = target_user_id;
    
    -- Order items (via orders)
    RETURN QUERY 
    SELECT 'order_items'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Items in ' || COUNT(DISTINCT order_id)::TEXT || ' orders', 'No records')::TEXT
    FROM order_items oi 
    JOIN orders o ON oi.order_id = o.id 
    WHERE o.user_id = target_user_id;
    
    -- Cart items
    RETURN QUERY 
    SELECT 'cart_items'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Cart items: ' || COUNT(*)::TEXT, 'No records')::TEXT
    FROM cart_items WHERE user_id = target_user_id;
    
    -- Digital products
    RETURN QUERY 
    SELECT 'digital_products'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE(string_agg(name, ', '), 'No records')::TEXT
    FROM digital_products WHERE user_id = target_user_id;
    
    -- Digital downloads
    RETURN QUERY 
    SELECT 'digital_downloads'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Downloads: ' || COUNT(*)::TEXT, 'No records')::TEXT
    FROM digital_downloads WHERE user_id = target_user_id;
    
    -- Designs
    RETURN QUERY 
    SELECT 'designs'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Designs: ' || COUNT(*)::TEXT, 'No records')::TEXT
    FROM designs WHERE user_id = target_user_id;
    
    -- Quotes (as customer or creator)
    RETURN QUERY 
    SELECT 'quotes'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Quotes: ' || COUNT(*)::TEXT, 'No records')::TEXT
    FROM quotes WHERE customer_id = target_user_id OR created_by = target_user_id;
    
    -- Support tickets
    RETURN QUERY 
    SELECT 'support_tickets'::TEXT, 
           COUNT(*)::INTEGER,
           COALESCE('Tickets: ' || COUNT(*)::TEXT, 'No records')::TEXT
    FROM support_tickets WHERE customer_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a backup of user data before deletion
CREATE OR REPLACE FUNCTION backup_user_data(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    backup_table_name TEXT;
    user_email TEXT;
    backup_timestamp TEXT;
BEGIN
    -- Get user email for backup naming
    SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
    
    IF user_email IS NULL THEN
        RETURN 'ERROR: User not found';
    END IF;
    
    -- Create timestamp for backup
    backup_timestamp := to_char(NOW(), 'YYYYMMDD_HH24MISS');
    backup_table_name := 'user_backup_' || replace(user_email, '@', '_at_') || '_' || backup_timestamp;
    
    -- Create backup table with user data
    EXECUTE format('
        CREATE TABLE %I AS
        SELECT 
            ''auth_users'' as source_table,
            au.id::TEXT as record_id,
            row_to_json(au.*) as data,
            NOW() as backup_timestamp
        FROM auth.users au WHERE id = %L
        
        UNION ALL
        
        SELECT 
            ''user_profiles'' as source_table,
            up.id::TEXT as record_id,
            row_to_json(up.*) as data,
            NOW() as backup_timestamp
        FROM user_profiles up WHERE id = %L
        
        UNION ALL
        
        SELECT 
            ''orders'' as source_table,
            o.id::TEXT as record_id,
            row_to_json(o.*) as data,
            NOW() as backup_timestamp
        FROM orders o WHERE user_id = %L
        
        UNION ALL
        
        SELECT 
            ''order_items'' as source_table,
            oi.id::TEXT as record_id,
            row_to_json(oi.*) as data,
            NOW() as backup_timestamp
        FROM order_items oi 
        JOIN orders o ON oi.order_id = o.id 
        WHERE o.user_id = %L
        
        UNION ALL
        
        SELECT 
            ''digital_products'' as source_table,
            dp.id::TEXT as record_id,
            row_to_json(dp.*) as data,
            NOW() as backup_timestamp
        FROM digital_products dp WHERE user_id = %L
        
        UNION ALL
        
        SELECT 
            ''cart_items'' as source_table,
            ci.id::TEXT as record_id,
            row_to_json(ci.*) as data,
            NOW() as backup_timestamp
        FROM cart_items ci WHERE user_id = %L
    ', backup_table_name, target_user_id, target_user_id, target_user_id, target_user_id, target_user_id, target_user_id);
    
    RETURN 'SUCCESS: Backup created as table: ' || backup_table_name;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
    metric TEXT,
    count INTEGER,
    details TEXT
) AS $$
BEGIN
    -- Total users by role
    RETURN QUERY
    SELECT 
        'Total Users by Role'::TEXT,
        COUNT(*)::INTEGER,
        string_agg(role::TEXT || ': ' || role_count::TEXT, ', ')
    FROM (
        SELECT 
            COALESCE(up.role::TEXT, 'no_profile') as role,
            COUNT(*) as role_count
        FROM auth.users au
        LEFT JOIN user_profiles up ON au.id = up.id
        GROUP BY up.role
    ) role_stats;
    
    -- Users with orders
    RETURN QUERY
    SELECT 
        'Users with Orders'::TEXT,
        COUNT(DISTINCT user_id)::INTEGER,
        'Users who have placed at least one order'::TEXT
    FROM orders;
    
    -- Users with digital products
    RETURN QUERY
    SELECT 
        'Users with Digital Products'::TEXT,
        COUNT(DISTINCT user_id)::INTEGER,
        'Users who have created digital products'::TEXT
    FROM digital_products;
    
    -- Inactive users (no orders, no digital products)
    RETURN QUERY
    SELECT 
        'Potentially Inactive Users'::TEXT,
        COUNT(*)::INTEGER,
        'Users with no orders and no digital products'::TEXT
    FROM auth.users au
    LEFT JOIN orders o ON au.id = o.user_id
    LEFT JOIN digital_products dp ON au.id = dp.user_id
    WHERE o.id IS NULL AND dp.id IS NULL;
    
    -- Recent registrations (last 30 days)
    RETURN QUERY
    SELECT 
        'Recent Registrations (30 days)'::TEXT,
        COUNT(*)::INTEGER,
        'Users registered in the last 30 days'::TEXT
    FROM auth.users
    WHERE created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to find users by criteria for cleanup
CREATE OR REPLACE FUNCTION find_users_for_cleanup(
    days_inactive INTEGER DEFAULT 90,
    exclude_with_orders BOOLEAN DEFAULT TRUE,
    exclude_with_digital_products BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    role TEXT,
    has_orders BOOLEAN,
    has_digital_products BOOLEAN,
    days_since_creation INTEGER,
    days_since_last_signin INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.created_at,
        au.last_sign_in_at,
        COALESCE(up.role::TEXT, 'no_profile'),
        (o.order_count > 0) as has_orders,
        (dp.product_count > 0) as has_digital_products,
        EXTRACT(DAY FROM NOW() - au.created_at)::INTEGER as days_since_creation,
        CASE 
            WHEN au.last_sign_in_at IS NOT NULL 
            THEN EXTRACT(DAY FROM NOW() - au.last_sign_in_at)::INTEGER
            ELSE NULL
        END as days_since_last_signin
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as order_count 
        FROM orders 
        GROUP BY user_id
    ) o ON au.id = o.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as product_count 
        FROM digital_products 
        GROUP BY user_id
    ) dp ON au.id = dp.user_id
    WHERE 
        -- Exclude system accounts
        au.email NOT IN ('admin@example.com', 'operator@example.com')
        -- Check inactivity
        AND (
            au.last_sign_in_at IS NULL 
            OR au.last_sign_in_at < NOW() - INTERVAL '1 day' * days_inactive
        )
        -- Optionally exclude users with orders
        AND (NOT exclude_with_orders OR COALESCE(o.order_count, 0) = 0)
        -- Optionally exclude users with digital products
        AND (NOT exclude_with_digital_products OR COALESCE(dp.product_count, 0) = 0)
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES AND SAFETY COMMANDS
-- =====================================================

-- 1. Get overall user statistics
-- SELECT * FROM get_user_statistics();

-- 2. Find inactive users for potential cleanup
-- SELECT * FROM find_users_for_cleanup(90, TRUE, TRUE);

-- 3. Preview what would be deleted for a specific user
-- SELECT * FROM preview_user_deletion('user-uuid-here');

-- 4. Create backup before deletion
-- SELECT backup_user_data('user-uuid-here');

-- 5. Safe deletion workflow:
-- Step 1: Preview the user data
-- SELECT * FROM preview_user_deletion('user-uuid-here');
-- 
-- Step 2: Create backup
-- SELECT backup_user_data('user-uuid-here');
-- 
-- Step 3: Perform deletion
-- SELECT * FROM hard_delete_user('user-uuid-here');

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- List all backup tables
-- SELECT tablename 
-- FROM pg_tables 
-- WHERE tablename LIKE 'user_backup_%' 
-- ORDER BY tablename DESC;

-- Clean up old backup tables (older than 30 days)
-- DO $$
-- DECLARE
--     backup_table TEXT;
-- BEGIN
--     FOR backup_table IN 
--         SELECT tablename 
--         FROM pg_tables 
--         WHERE tablename LIKE 'user_backup_%'
--         AND tablename < 'user_backup_' || to_char(NOW() - INTERVAL '30 days', 'YYYYMMDD')
--     LOOP
--         EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(backup_table);
--         RAISE NOTICE 'Dropped old backup table: %', backup_table;
--     END LOOP;
-- END $$;