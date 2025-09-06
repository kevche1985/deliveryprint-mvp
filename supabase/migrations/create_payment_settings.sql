-- Create payment_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(500),
    endpoints JSONB DEFAULT '{}',
    additional_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default payment providers
INSERT INTO payment_settings (provider_name, display_name, is_active, is_test_mode, endpoints, additional_settings) VALUES
('wompi', 'Wompi', false, true, 
 '{"base_url": "https://sandbox.wompi.co/v1", "transactions": "/transactions", "acceptance_token": "/merchants/{public_key}"}',
 '{"currency": "COP", "country": "CO", "supported_methods": ["CARD", "NEQUI", "PSE"]}'),
('paypal', 'PayPal', false, true,
 '{"base_url": "https://api.sandbox.paypal.com", "oauth": "/v1/oauth2/token", "payments": "/v2/checkout/orders"}',
 '{"currency": "USD", "country": "US", "supported_methods": ["paypal", "card"]}'),
('stripe', 'Stripe', false, true,
 '{"base_url": "https://api.stripe.com/v1", "payment_intents": "/payment_intents", "customers": "/customers"}',
 '{"currency": "USD", "country": "US", "supported_methods": ["card", "apple_pay", "google_pay"]}'),
('cash_on_delivery', 'Cash on Delivery', true, false,
 '{}',
 '{"currency": "USD", "description": "Pay when you receive your order"}')
ON CONFLICT (provider_name) DO NOTHING;

-- Create payment_transactions table for tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    provider_name VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(200),
    external_transaction_id VARCHAR(200),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_settings_provider ON payment_settings(provider_name);
CREATE INDEX IF NOT EXISTS idx_payment_settings_active ON payment_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Show created tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('payment_settings', 'payment_transactions')
ORDER BY table_name;
