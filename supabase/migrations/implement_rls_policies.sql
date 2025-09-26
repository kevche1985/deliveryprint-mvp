-- Implement Row Level Security (RLS) policies for all tables
-- This ensures users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all order items" ON order_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Products policies (public read, admin write)
CREATE POLICY "Everyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Product variants policies
CREATE POLICY "Everyone can view product variants" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_variants.product_id 
      AND products.is_active = true
    )
  );

CREATE POLICY "Admins can manage product variants" ON product_variants
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Product images policies
CREATE POLICY "Everyone can view product images" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.is_active = true
    )
  );

CREATE POLICY "Admins can manage product images" ON product_images
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Categories policies
CREATE POLICY "Everyone can view active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all categories" ON categories
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Designs policies
CREATE POLICY "Users can view own designs" ON designs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own designs" ON designs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs" ON designs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs" ON designs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view public designs" ON designs
  FOR SELECT USING (is_public = true);

CREATE POLICY "Everyone can view template designs" ON designs
  FOR SELECT USING (is_template = true);

CREATE POLICY "Admins can view all designs" ON designs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all designs" ON designs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Digital products policies
CREATE POLICY "Users can view own digital products" ON digital_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own digital products" ON digital_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own digital products" ON digital_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own digital products" ON digital_products
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all digital products" ON digital_products
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all digital products" ON digital_products
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Quotes policies
CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can create quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all quotes" ON quotes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Operators can view all quotes" ON quotes
  FOR SELECT USING (auth.jwt() ->> 'role' = 'operator');

CREATE POLICY "Operators can update quotes" ON quotes
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'operator');

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is operator or admin
CREATE OR REPLACE FUNCTION is_operator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

COMMIT;