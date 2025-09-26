# User Cleanup Scripts Documentation

## ⚠️ CRITICAL WARNING
These scripts perform **IRREVERSIBLE HARD DELETES** of user data. Use with extreme caution, especially in production environments.

## Overview

This directory contains two SQL scripts for safely managing user cleanup operations:

1. **`hard_delete_user.sql`** - Core deletion functions
2. **`user_cleanup_helper.sql`** - Safety utilities and preview functions

## Files Description

### hard_delete_user.sql
Contains the main deletion functions:
- `hard_delete_user(UUID)` - Deletes a single user and all related data
- `hard_delete_users_bulk()` - Bulk deletion with pattern matching

### user_cleanup_helper.sql
Contains safety and utility functions:
- `preview_user_deletion(UUID)` - Preview what will be deleted
- `backup_user_data(UUID)` - Create backup before deletion
- `get_user_statistics()` - Get user statistics
- `find_users_for_cleanup()` - Find inactive users

## Database Tables Affected

The scripts will delete data from these tables in the correct dependency order:

1. `ticket_responses`
2. `quote_items`
3. `quote_history`
4. `quote_communications`
5. `order_items`
6. `cart_items`
7. `digital_downloads`
8. `digital_products`
9. `designs`
10. `support_tickets`
11. `quotes`
12. `orders`
13. `user_profiles`
14. `auth.users`

## Installation

1. Connect to your Supabase database
2. Run the scripts in order:
   ```sql
   \i supabase/scripts/hard_delete_user.sql
   \i supabase/scripts/user_cleanup_helper.sql
   ```

## Safe Usage Workflow

### For Single User Deletion

```sql
-- Step 1: Get user statistics
SELECT * FROM get_user_statistics();

-- Step 2: Find the user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'user@example.com';

-- Step 3: Preview what will be deleted
SELECT * FROM preview_user_deletion('user-uuid-here');

-- Step 4: Create backup (RECOMMENDED)
SELECT backup_user_data('user-uuid-here');

-- Step 5: Perform deletion
SELECT * FROM hard_delete_user('user-uuid-here');
```

### For Bulk Cleanup

```sql
-- Step 1: Find inactive users
SELECT * FROM find_users_for_cleanup(90, TRUE, TRUE);

-- Step 2: Preview specific users
SELECT * FROM preview_user_deletion('user-uuid-here');

-- Step 3: Delete test users (example)
SELECT * FROM hard_delete_users_bulk('%test%', NULL, TRUE);

-- Step 4: Delete inactive customers (example)
SELECT * FROM hard_delete_users_bulk(NULL, 'customer', TRUE);
```

## Function Parameters

### hard_delete_user(target_user_id UUID)
- `target_user_id`: UUID of the user to delete
- Returns: Table with operation details

### hard_delete_users_bulk(email_pattern, user_role, confirm_deletion)
- `email_pattern`: SQL LIKE pattern for email matching (e.g., '%test%')
- `user_role`: Specific role to target ('customer', 'admin', 'operator', 'supplier')
- `confirm_deletion`: MUST be TRUE to proceed (safety check)
- Returns: Detailed results for each user deleted

### find_users_for_cleanup(days_inactive, exclude_with_orders, exclude_with_digital_products)
- `days_inactive`: Number of days since last sign-in (default: 90)
- `exclude_with_orders`: Skip users who have orders (default: TRUE)
- `exclude_with_digital_products`: Skip users with digital products (default: TRUE)
- Returns: List of users matching cleanup criteria

## Safety Features

### Built-in Protections
- System accounts (`admin@example.com`, `operator@example.com`) are protected
- Bulk operations require explicit confirmation
- All operations return detailed logs
- Foreign key constraints are respected

### Backup System
- `backup_user_data()` creates timestamped backup tables
- Backup tables include all user-related data in JSON format
- Automatic naming: `user_backup_email_at_domain_YYYYMMDD_HHMMSS`

### Preview System
- `preview_user_deletion()` shows exactly what will be deleted
- No actual deletion occurs during preview
- Shows record counts and sample data

## Examples

### Delete Test Users
```sql
-- Preview test users
SELECT au.id, au.email, up.role 
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email ILIKE '%test%';

-- Delete all test users
SELECT * FROM hard_delete_users_bulk('%test%', NULL, TRUE);
```

### Delete Inactive Customers
```sql
-- Find inactive customers (90+ days, no orders)
SELECT * FROM find_users_for_cleanup(90, TRUE, TRUE);

-- Delete inactive customers
SELECT * FROM hard_delete_users_bulk(NULL, 'customer', TRUE);
```

### Clean Up Specific User
```sql
-- Get user ID
SELECT id FROM auth.users WHERE email = 'user@example.com';

-- Preview deletion
SELECT * FROM preview_user_deletion('user-uuid-here');

-- Create backup
SELECT backup_user_data('user-uuid-here');

-- Delete user
SELECT * FROM hard_delete_user('user-uuid-here');
```

## Maintenance

### View Backup Tables
```sql
SELECT tablename, 
       pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE tablename LIKE 'user_backup_%' 
ORDER BY tablename DESC;
```

### Clean Old Backups (30+ days)
```sql
DO $$
DECLARE
    backup_table TEXT;
BEGIN
    FOR backup_table IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'user_backup_%'
        AND tablename < 'user_backup_' || to_char(NOW() - INTERVAL '30 days', 'YYYYMMDD')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(backup_table);
        RAISE NOTICE 'Dropped old backup table: %', backup_table;
    END LOOP;
END $$;
```

## Error Handling

The scripts include comprehensive error handling:
- User existence validation
- Foreign key constraint management
- Transaction rollback on errors
- Detailed error messages

## Best Practices

1. **Always backup first** - Use `backup_user_data()` before deletion
2. **Test in staging** - Never run bulk operations directly in production
3. **Preview first** - Use `preview_user_deletion()` to understand impact
4. **Monitor logs** - Review all operation results
5. **Gradual cleanup** - Delete in small batches for large operations
6. **Regular maintenance** - Clean up old backup tables periodically

## Recovery

If you need to recover deleted data:
1. Locate the backup table created before deletion
2. Extract data from the JSON columns
3. Recreate user accounts and restore data manually

## Support

For issues or questions:
1. Check the operation logs returned by the functions
2. Verify user existence and permissions
3. Review foreign key constraints
4. Check backup table creation

## Version History

- v1.0: Initial release with core deletion and safety features
- Supports all current database schema tables
- Includes comprehensive backup and preview systems