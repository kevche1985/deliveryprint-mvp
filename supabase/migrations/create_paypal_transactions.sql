-- Create PayPal transactions table
CREATE TABLE IF NOT EXISTS paypal_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    paypal_order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    paypal_response JSONB,
    capture_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_order_id ON paypal_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_paypal_order_id ON paypal_transactions(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_transaction_id ON paypal_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_paypal_transactions_status ON paypal_transactions(status);

-- Add RLS policies
ALTER TABLE paypal_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own transactions
CREATE POLICY "Users can view their own PayPal transactions" ON paypal_transactions
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

-- Policy for service role to manage all transactions
CREATE POLICY "Service role can manage PayPal transactions" ON paypal_transactions
    FOR ALL USING (auth.role() = 'service_role');
