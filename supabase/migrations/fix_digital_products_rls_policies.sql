-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can insert their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can update their own digital products" ON digital_products;
DROP POLICY IF EXISTS "Users can delete their own digital products" ON digital_products;

-- Create the digital_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS digital_products (
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

-- Create RLS policies that don't reference other tables
CREATE POLICY "Users can view their own digital products" ON digital_products
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own digital products" ON digital_products
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own digital products" ON digital_products
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own digital products" ON digital_products
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON digital_products(created_at);
