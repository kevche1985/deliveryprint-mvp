-- Add paypal_email column to paypal_transactions table
ALTER TABLE paypal_transactions 
ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_email 
ON paypal_transactions(paypal_email);

-- Add index for order_id lookups
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_order_id 
ON paypal_transactions(order_id);
