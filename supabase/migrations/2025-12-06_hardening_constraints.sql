-- Safety: add indexes and constraints with guards to avoid conflicts

-- Unique template keys for emails
CREATE UNIQUE INDEX IF NOT EXISTS email_templates_template_key_uidx ON email_templates (template_key);

-- Unique order numbers
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_uidx ON orders (order_number);

-- Indexes for join performance
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items (product_id);
CREATE INDEX IF NOT EXISTS digital_order_items_order_id_idx ON digital_order_items (order_id);
CREATE INDEX IF NOT EXISTS digital_order_items_product_id_idx ON digital_order_items (product_id);
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON payment_transactions (order_id);
CREATE INDEX IF NOT EXISTS digital_downloads_order_item_id_idx ON digital_downloads (order_item_id);

-- Foreign keys (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_orders'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT fk_order_items_orders
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_order_items_products'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT fk_order_items_products
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_digital_order_items_orders'
  ) THEN
    ALTER TABLE digital_order_items
      ADD CONSTRAINT fk_digital_order_items_orders
      FOREIGN KEY (order_id) REFERENCES digital_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_digital_order_items_products'
  ) THEN
    ALTER TABLE digital_order_items
      ADD CONSTRAINT fk_digital_order_items_products
      FOREIGN KEY (product_id) REFERENCES digital_products(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Basic positivity checks on monetary fields (non-breaking if data is already valid)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_total_nonnegative'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_total_nonnegative CHECK (total >= 0);
  END IF;
END $$;

