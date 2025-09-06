-- Fix wompi_transactions table to match the API expectations
ALTER TABLE wompi_transactions 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS status VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS card_info JSONB,
ADD COLUMN IF NOT EXISTS redirect_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS additional_data JSONB,
ADD COLUMN IF NOT EXISTS wompi_response JSONB,
ADD COLUMN IF NOT EXISTS wompi_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS authorization_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS three_ds_url TEXT,
ADD COLUMN IF NOT EXISTS error_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update the existing columns to match API expectations
-- Map existing columns to new structure if needed
UPDATE wompi_transactions SET 
  external_id = id_externo,
  amount = monto,
  status = estado,
  customer_email = email,
  customer_name = CONCAT(nombre, ' ', apellido),
  customer_phone = telefono
WHERE external_id IS NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_external_id ON wompi_transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_status ON wompi_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_customer_email ON wompi_transactions(customer_email);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_wompi_transaction_id ON wompi_transactions(wompi_transaction_id);

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'wompi_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
