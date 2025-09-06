-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_type ON digital_products(type);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);

CREATE INDEX IF NOT EXISTS idx_digital_orders_user_id ON digital_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_orders_status ON digital_orders(status);
CREATE INDEX IF NOT EXISTS idx_digital_orders_order_number ON digital_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_digital_order_items_order_id ON digital_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_digital_order_items_product_id ON digital_order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_id ON digital_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_order_item_id ON digital_downloads(order_item_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_expires_at ON digital_downloads(expires_at);

-- Enable RLS on all tables
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for digital_products
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for digital_orders
CREATE POLICY "Users can view their own digital orders" ON digital_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own digital orders" ON digital_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital orders" ON digital_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digital orders" ON digital_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for digital_order_items
CREATE POLICY "Users can view their digital order items" ON digital_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM digital_orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create digital order items for their orders" ON digital_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM digital_orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all digital order items" ON digital_order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for digital_downloads
CREATE POLICY "Users can view their own digital downloads" ON digital_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own digital downloads" ON digital_downloads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all digital downloads" ON digital_downloads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
