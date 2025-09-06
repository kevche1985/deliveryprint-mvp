-- Drop existing policies if any
DROP POLICY IF EXISTS "paypal_transactions_insert_policy" ON paypal_transactions;
DROP POLICY IF EXISTS "paypal_transactions_select_policy" ON paypal_transactions;
DROP POLICY IF EXISTS "paypal_transactions_update_policy" ON paypal_transactions;

-- Enable RLS on paypal_transactions table
ALTER TABLE paypal_transactions ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (for API routes)
CREATE POLICY "paypal_transactions_service_role_policy" ON paypal_transactions
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view their own transactions
CREATE POLICY "paypal_transactions_user_select_policy" ON paypal_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = paypal_transactions.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Allow authenticated users to insert transactions for their own orders
CREATE POLICY "paypal_transactions_user_insert_policy" ON paypal_transactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = paypal_transactions.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON paypal_transactions TO service_role;
GRANT SELECT, INSERT ON paypal_transactions TO authenticated;
