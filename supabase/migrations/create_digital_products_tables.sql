-- Create digital products table
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('logo', 'image', 'font')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  generation_inputs JSONB,
  generated_content JSONB,
  preview_url TEXT,
  download_url TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital orders table
CREATE TABLE IF NOT EXISTS digital_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'delivered')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  billing_address JSONB,
  currency VARCHAR(3) DEFAULT 'USD',
  download_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital order items table
CREATE TABLE IF NOT EXISTS digital_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES digital_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES digital_products(id),
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  selected_formats JSONB NOT NULL DEFAULT '[]',
  selected_license VARCHAR(50) NOT NULL DEFAULT 'personal',
  format_options JSONB NOT NULL DEFAULT '[]',
  license_options JSONB NOT NULL DEFAULT '[]',
  final_price DECIMAL(10,2) NOT NULL,
  download_ready BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital downloads table
CREATE TABLE IF NOT EXISTS digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES digital_order_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  download_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  format VARCHAR(10) NOT NULL,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_type ON digital_products(type);
CREATE INDEX IF NOT EXISTS idx_digital_orders_user_id ON digital_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_status ON digital_orders(status);
CREATE INDEX IF NOT EXISTS idx_digital_order_items_order_id ON digital_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_id ON digital_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_expires_at ON digital_downloads(expires_at);

-- Enable RLS
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for digital_products
CREATE POLICY "Users can view their own digital products" ON digital_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital products" ON digital_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital products" ON digital_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digital products" ON digital_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for digital_orders
CREATE POLICY "Users can view their own digital orders" ON digital_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create digital orders" ON digital_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital orders" ON digital_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digital orders" ON digital_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for digital_order_items
CREATE POLICY "Users can view their digital order items" ON digital_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM digital_orders 
      WHERE digital_orders.id = digital_order_items.order_id 
      AND digital_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create digital order items" ON digital_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_orders 
      WHERE digital_orders.id = digital_order_items.order_id 
      AND digital_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all digital order items" ON digital_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for digital_downloads
CREATE POLICY "Users can view their own digital downloads" ON digital_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital downloads" ON digital_downloads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digital downloads" ON digital_downloads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Create function to automatically set download expiration
CREATE OR REPLACE FUNCTION set_download_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.download_expires_at = NEW.created_at + INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for digital orders
CREATE TRIGGER set_digital_order_expiration
  BEFORE INSERT ON digital_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_download_expiration();

-- Create function to generate download URLs
CREATE OR REPLACE FUNCTION generate_download_urls(order_item_id UUID)
RETURNS VOID AS $$
DECLARE
  item_record RECORD;
  format_item TEXT;
  download_url TEXT;
BEGIN
  -- Get the order item details
  SELECT * INTO item_record FROM digital_order_items WHERE id = order_item_id;
  
  IF item_record IS NOT NULL THEN
    -- Generate download URLs for each selected format
    FOR format_item IN SELECT jsonb_array_elements_text(item_record.selected_formats)
    LOOP
      -- Generate a secure download URL (in production, this would be a signed URL)
      download_url := '/api/downloads/' || order_item_id || '/' || format_item;
      
      INSERT INTO digital_downloads (
        order_item_id,
        user_id,
        download_url,
        file_name,
        format,
        expires_at
      ) VALUES (
        order_item_id,
        (SELECT user_id FROM digital_orders WHERE id = item_record.order_id),
        download_url,
        item_record.name || '.' || format_item,
        format_item,
        NOW() + INTERVAL '7 days'
      );
    END LOOP;
    
    -- Mark the order item as download ready
    UPDATE digital_order_items 
    SET download_ready = true 
    WHERE id = order_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
