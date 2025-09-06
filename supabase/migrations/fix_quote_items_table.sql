-- Drop existing quote_items table if it exists
DROP TABLE IF EXISTS quote_items CASCADE;

-- Create quote_items table with correct structure
CREATE TABLE quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_created_at ON quote_items(created_at);

-- Enable RLS
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quote items" ON quote_items
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own quote items" ON quote_items
    FOR INSERT WITH CHECK (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all quote items" ON quote_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

CREATE POLICY "Admins can manage all quote items" ON quote_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quote_items_updated_at 
    BEFORE UPDATE ON quote_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
