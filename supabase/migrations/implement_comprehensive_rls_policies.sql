-- Comprehensive RLS Policies for Products Architecture
-- Based on analysis in memory-log/decisions/DEC-0003.md

-- =============================================================================
-- 1. FIX PRODUCTS TABLE RLS (Physical Products)
-- =============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "public_can_view_active_products" ON products;
DROP POLICY IF EXISTS "admins_can_manage_products" ON products;
DROP POLICY IF EXISTS "operators_can_view_all_products" ON products;

-- Policy 1: Public read access for active products (CRITICAL FIX)
CREATE POLICY "public_can_view_active_products" ON products
    FOR SELECT 
    USING (is_active = true);

-- Policy 2: Admin management access
CREATE POLICY "admins_can_manage_products" ON products
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Policy 3: Operators can view all products (including inactive)
CREATE POLICY "operators_can_view_all_products" ON products
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'operator')
        )
    );

-- =============================================================================
-- 2. OPTIMIZE DIGITAL_PRODUCTS RLS (AI-Generated Products)
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with better structure
DROP POLICY IF EXISTS "users_own_digital_products" ON digital_products;
DROP POLICY IF EXISTS "Users can view their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can insert their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can delete their own digital products" ON digital_products;
DROP POLICY IF EXISTS "admins_can_view_all_digital_products" ON digital_products;
DROP POLICY IF EXISTS "public_can_view_published_digital_products" ON digital_products;

-- Policy 1: Users can manage their own digital products
CREATE POLICY "users_own_digital_products" ON digital_products
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 2: Admins can view all digital products
CREATE POLICY "admins_can_view_all_digital_products" ON digital_products
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Policy 3: Public can view published digital products (for marketplace)
CREATE POLICY "public_can_view_published_digital_products" ON digital_products
    FOR SELECT 
    USING (
        status IN ('purchased', 'published') 
        AND metadata->>'is_public' = 'true'
    );

-- =============================================================================
-- 3. ADD PERFORMANCE INDEXES
-- =============================================================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Digital products indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_type ON digital_products(type);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON digital_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_products_metadata ON digital_products USING gin(metadata);

-- =============================================================================
-- 4. ADD MISSING COLUMNS (IF NEEDED)
-- =============================================================================

-- Add inventory tracking to products if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'inventory_count') THEN
        ALTER TABLE products ADD COLUMN inventory_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'track_inventory') THEN
        ALTER TABLE products ADD COLUMN track_inventory BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight') THEN
        ALTER TABLE products ADD COLUMN weight DECIMAL(8,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'dimensions') THEN
        ALTER TABLE products ADD COLUMN dimensions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add metadata column to products for future extensibility
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metadata') THEN
        ALTER TABLE products ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================================================
-- 5. CREATE ADMIN VIEW FOR UNIFIED PRODUCT MANAGEMENT
-- =============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_all_products;

-- Create unified view for admin dashboard
CREATE VIEW admin_all_products AS
SELECT 
    id,
    name,
    description,
    price,
    'physical' as product_type,
    category,
    image as image_url,
    is_active,
    is_featured,
    created_at,
    updated_at,
    NULL as user_id,
    NULL as generation_inputs
FROM products
UNION ALL
SELECT 
    id,
    name,
    description,
    base_price as price,
    'digital' as product_type,
    type as category,
    preview_url as image_url,
    (status != 'archived') as is_active,
    false as is_featured,
    created_at,
    updated_at,
    user_id,
    generation_inputs
FROM digital_products;

-- Grant access to admin view
GRANT SELECT ON admin_all_products TO authenticated;

-- =============================================================================
-- 6. VERIFICATION QUERIES
-- =============================================================================

-- Test public access to products (should return active products)
SELECT 'PUBLIC ACCESS TEST' as test_type, COUNT(*) as count 
FROM products 
WHERE is_active = true;

-- Test digital products structure
SELECT 'DIGITAL PRODUCTS TEST' as test_type, COUNT(*) as count 
FROM digital_products;

-- Verify RLS policies are created
SELECT 
    'RLS POLICIES' as test_type,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('products', 'digital_products')
ORDER BY tablename, policyname;

-- Verify indexes are created
SELECT 
    'INDEXES' as test_type,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('products', 'digital_products')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE products IS 'Physical print-on-demand products available to all users';
COMMENT ON TABLE digital_products IS 'AI-generated digital assets owned by specific users';
COMMENT ON VIEW admin_all_products IS 'Unified view of all products for admin dashboard';

COMMENT ON POLICY "public_can_view_active_products" ON products IS 'Allows anonymous users to browse active physical products';
COMMENT ON POLICY "users_own_digital_products" ON digital_products IS 'Users can only access their own digital products';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

SELECT 'RLS POLICIES MIGRATION COMPLETED SUCCESSFULLY' as status;