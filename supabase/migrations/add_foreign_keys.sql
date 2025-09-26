-- Add foreign key constraints to ensure data integrity
-- This migration adds proper relationships between tables

-- Add foreign key constraints for order_items table
ALTER TABLE order_items 
ADD CONSTRAINT IF NOT EXISTS fk_order_items_order_id 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT IF NOT EXISTS fk_order_items_product_id 
FOREIGN KEY (product_id) REFERENCES products(id);

-- Add foreign key constraints for orders table
ALTER TABLE orders 
ADD CONSTRAINT IF NOT EXISTS fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key constraints for product_variants table
ALTER TABLE product_variants 
ADD CONSTRAINT IF NOT EXISTS fk_product_variants_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraints for product_images table
ALTER TABLE product_images 
ADD CONSTRAINT IF NOT EXISTS fk_product_images_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraints for categories table (self-referencing)
ALTER TABLE categories 
ADD CONSTRAINT IF NOT EXISTS fk_categories_parent_id 
FOREIGN KEY (parent_id) REFERENCES categories(id);

-- Add foreign key constraints for products to categories
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS fk_products_category_id 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- Add foreign key constraints for designs table
ALTER TABLE designs 
ADD CONSTRAINT IF NOT EXISTS fk_designs_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE designs 
ADD CONSTRAINT IF NOT EXISTS fk_designs_order_id 
FOREIGN KEY (order_id) REFERENCES orders(id);

-- Add foreign key constraints for digital_products table
ALTER TABLE digital_products 
ADD CONSTRAINT IF NOT EXISTS fk_digital_products_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add foreign key constraints for quotes table
ALTER TABLE quotes 
ADD CONSTRAINT IF NOT EXISTS fk_quotes_customer_id 
FOREIGN KEY (customer_id) REFERENCES auth.users(id);

ALTER TABLE quotes 
ADD CONSTRAINT IF NOT EXISTS fk_quotes_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add indexes for better performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_order_id ON designs(order_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);

-- Add performance indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON digital_products(status);
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);

COMMIT;