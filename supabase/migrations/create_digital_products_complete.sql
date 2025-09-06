-- First, drop the table if it exists to start fresh
DROP TABLE IF EXISTS digital_products CASCADE;

-- Create the digital_products table with all necessary columns
CREATE TABLE digital_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('logo', 'font', 'image')),
    status TEXT NOT NULL DEFAULT 'unpurchased' CHECK (status IN ('unpurchased', 'generating', 'generated', 'purchased')),
    base_price DECIMAL(10,2) DEFAULT 0.00,
    preview_url TEXT,
    generation_inputs JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "digital_products_select_policy" ON digital_products;
DROP POLICY IF EXISTS "digital_products_insert_policy" ON digital_products;
DROP POLICY IF EXISTS "digital_products_update_policy" ON digital_products;
DROP POLICY IF EXISTS "digital_products_delete_policy" ON digital_products;

-- Create simple RLS policies that only check auth.uid()
CREATE POLICY "digital_products_select_policy" ON digital_products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "digital_products_insert_policy" ON digital_products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "digital_products_update_policy" ON digital_products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "digital_products_delete_policy" ON digital_products
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON digital_products(created_at);

-- Insert some test data for the current user (if authenticated)
DO $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO digital_products (user_id, name, type, status, base_price, preview_url, generation_inputs, metadata)
        VALUES 
            (auth.uid(), 'Sample Logo Design', 'logo', 'purchased', 9.99, '/placeholder.svg?height=300&width=300', '{"prompt": "modern logo design"}', '{"is_favorite": false}'),
            (auth.uid(), 'Custom Font', 'font', 'unpurchased', 14.99, '/placeholder.svg?height=300&width=300', '{"prompt": "elegant font"}', '{"is_favorite": true}'),
            (auth.uid(), 'AI Generated Image', 'image', 'generated', 4.99, '/placeholder.svg?height=300&width=300', '{"prompt": "abstract art"}', '{"is_favorite": false}');
    END IF;
END $$;
