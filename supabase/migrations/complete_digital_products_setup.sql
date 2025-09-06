-- Ensure digital_products table exists with correct structure
CREATE TABLE IF NOT EXISTS digital_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('logo', 'image', 'font', 'custom_design')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_data JSONB NOT NULL DEFAULT '{}',
    generation_inputs JSONB DEFAULT '{}',
    generated_content JSONB DEFAULT '{}',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    preview_url TEXT,
    download_url TEXT,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'unpurchased' CHECK (status IN ('unpurchased', 'purchased', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_type ON digital_products(type);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON digital_products(created_at DESC);

-- Enable RLS
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can insert their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Admins can view all digital products" ON digital_products;
DROP POLICY IF EXISTS "Admins can manage all digital products" ON digital_products;

-- Create RLS policies
CREATE POLICY "Users can view their own digital products" ON digital_products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own digital products" ON digital_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital products" ON digital_products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all digital products" ON digital_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all digital products" ON digital_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Create storage bucket for digital products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for digital-products bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own digital products" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'digital-products' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Users can view their own digital products" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'digital-products' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY IF NOT EXISTS "Public can view digital products" ON storage.objects
    FOR SELECT USING (bucket_id = 'digital-products');

CREATE POLICY IF NOT EXISTS "Admins can manage all digital products" ON storage.objects
    FOR ALL USING (
        bucket_id = 'digital-products' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_digital_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_digital_products_updated_at ON digital_products;
CREATE TRIGGER trigger_update_digital_products_updated_at
    BEFORE UPDATE ON digital_products
    FOR EACH ROW
    EXECUTE FUNCTION update_digital_products_updated_at();

-- Ensure cart_items table can reference digital products
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_cart_items_digital_product_id ON cart_items(digital_product_id);

-- Update order_items table to include digital product reference
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_digital_product_id ON order_items(digital_product_id);

-- Insert some sample data for testing (optional)
-- This will be skipped if the table already has data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM digital_products LIMIT 1) THEN
        -- Only insert if table is empty
        INSERT INTO digital_products (
            user_id, 
            type, 
            name, 
            description, 
            file_data, 
            base_price, 
            status
        ) VALUES (
            (SELECT id FROM auth.users LIMIT 1), -- Use first available user
            'custom_design',
            'Sample Custom Design',
            'A sample custom design for testing',
            '{"formats": ["png", "pdf"], "design_data": {}}',
            19.99,
            'unpurchased'
        );
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON digital_products TO authenticated;
GRANT ALL ON digital_products TO service_role;
