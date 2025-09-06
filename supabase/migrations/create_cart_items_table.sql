-- Create cart_items table for persistent cart storage
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255), -- For anonymous users
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    digital_product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    customizations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or session_id is provided
    CONSTRAINT cart_items_user_or_session CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_digital_product_id ON cart_items(digital_product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at DESC);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can insert their own cart items" ON cart_items
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

CREATE POLICY "Admins can view all cart items" ON cart_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cart_items_updated_at ON cart_items;
CREATE TRIGGER trigger_update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_items_updated_at();

-- Create function to clean up old anonymous cart items (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS void AS $$
BEGIN
    DELETE FROM cart_items 
    WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON cart_items TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON cart_items TO anon;

-- Create a function to migrate localStorage cart to database cart for logged-in users
CREATE OR REPLACE FUNCTION migrate_cart_to_database(
    p_user_id UUID,
    p_cart_items JSONB
)
RETURNS void AS $$
DECLARE
    item JSONB;
BEGIN
    -- Clear existing cart items for this user
    DELETE FROM cart_items WHERE user_id = p_user_id;
    
    -- Insert new cart items
    FOR item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        INSERT INTO cart_items (
            user_id,
            product_id,
            variant_id,
            design_id,
            digital_product_id,
            name,
            quantity,
            price,
            image_url,
            customizations
        ) VALUES (
            p_user_id,
            COALESCE((item->>'productId')::UUID, NULL),
            COALESCE((item->>'variantId')::UUID, NULL),
            COALESCE((item->>'designId')::UUID, NULL),
            COALESCE((item->>'digitalProductId')::UUID, NULL),
            item->>'name',
            COALESCE((item->>'quantity')::INTEGER, 1),
            COALESCE((item->>'price')::DECIMAL, 0),
            item->>'image',
            COALESCE(item->'customizations', '{}'::JSONB)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the migration function
GRANT EXECUTE ON FUNCTION migrate_cart_to_database(UUID, JSONB) TO authenticated;
