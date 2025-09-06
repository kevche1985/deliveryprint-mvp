-- Fix RLS policies for orders table to allow admin access
-- This addresses permission errors when admins try to view orders

-- Check current RLS status and policies for orders table
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
WHERE tablename = 'orders';

-- Check if RLS is enabled on orders table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'orders';

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "admins_can_manage_orders" ON orders;
DROP POLICY IF EXISTS "users_can_view_own_orders" ON orders;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own orders
CREATE POLICY "users_can_view_own_orders" ON orders
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy 2: Users can create their own orders
CREATE POLICY "users_can_create_own_orders" ON orders
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own orders (limited)
CREATE POLICY "users_can_update_own_orders" ON orders
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can manage all orders (CRITICAL FOR ADMIN ACCESS)
CREATE POLICY "admins_can_manage_all_orders" ON orders
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Policy 5: Service role can manage all orders (for API operations)
CREATE POLICY "service_role_can_manage_orders" ON orders
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Also fix order_items table RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;
DROP POLICY IF EXISTS "admins_can_manage_order_items" ON order_items;
DROP POLICY IF EXISTS "users_can_view_own_order_items" ON order_items;

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view order items for their own orders
CREATE POLICY "users_can_view_own_order_items" ON order_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Policy 2: Users can create order items for their own orders
CREATE POLICY "users_can_create_order_items" ON order_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Policy 3: Users can update order items for their own orders
CREATE POLICY "users_can_update_order_items" ON order_items
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Policy 4: Admins can manage all order items (CRITICAL FOR ADMIN ACCESS)
CREATE POLICY "admins_can_manage_all_order_items" ON order_items
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Policy 5: Service role can manage all order items
CREATE POLICY "service_role_can_manage_order_items" ON order_items
    FOR ALL 
    USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT ALL ON order_items TO service_role;
GRANT SELECT, INSERT, UPDATE ON order_items TO authenticated;

-- Verify the policies are created correctly
SELECT 
    'ORDERS POLICIES' as table_type,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

SELECT 
    'ORDER_ITEMS POLICIES' as table_type,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;

-- Test admin access (this should work for admin users)
-- SELECT COUNT(*) as total_orders FROM orders;
-- SELECT COUNT(*) as total_order_items FROM order_items;

COMMENT ON POLICY "admins_can_manage_all_orders" ON orders IS 'Allows admin users to view and manage all orders in the admin panel';
COMMENT ON POLICY "admins_can_manage_all_order_items" ON order_items IS 'Allows admin users to view and manage all order items in the admin panel';