-- Ensure quotes table has all required columns
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS request_description TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Add constraints
ALTER TABLE quotes 
ADD CONSTRAINT quotes_priority_check 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE quotes 
ADD CONSTRAINT quotes_currency_check 
CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD'));

-- Update existing records to have valid priority if null
UPDATE quotes SET priority = 'normal' WHERE priority IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_priority ON quotes(priority);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);
