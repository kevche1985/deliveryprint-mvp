-- Drop existing tables if they exist to recreate with proper structure
DROP TABLE IF EXISTS quote_communications CASCADE;
DROP TABLE IF EXISTS quote_status_history CASCADE;
DROP TABLE IF EXISTS quote_files CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;

-- Create quotes table with all necessary columns
CREATE TABLE quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_company VARCHAR(255),
    service_type VARCHAR(100) NOT NULL,
    request_description TEXT NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'standard' CHECK (urgency_level IN ('standard', 'urgent', 'rush')),
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'both')),
    best_contact_time VARCHAR(20) DEFAULT 'anytime' CHECK (best_contact_time IN ('morning', 'afternoon', 'evening', 'anytime')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'pending', 'in_review', 'quote_sent', 'reviewed', 'approved', 'accepted', 'declined', 'rejected', 'cancelled', 'expired')),
    quote_amount DECIMAL(10,2),
    quote_details TEXT,
    internal_notes TEXT,
    customer_id UUID,
    created_by UUID,
    assigned_to UUID,
    valid_until TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) DEFAULT 'USD',
    prefilled_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_files table for file attachments
CREATE TABLE quote_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(20) DEFAULT 'customer' CHECK (uploaded_by IN ('customer', 'admin')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_status_history table for tracking status changes
CREATE TABLE quote_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_service_type ON quotes(service_type);
CREATE INDEX idx_quotes_urgency ON quotes(urgency_level);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quote_files_quote_id ON quote_files(quote_id);
CREATE INDEX idx_quote_status_history_quote_id ON quote_status_history(quote_id);

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes table - Allow public access for quote creation
CREATE POLICY "Anyone can create quotes" ON quotes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view quotes" ON quotes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update quotes" ON quotes
    FOR UPDATE USING (true);

-- RLS Policies for quote_files table
CREATE POLICY "Anyone can manage quote files" ON quote_files
    FOR ALL USING (true);

-- RLS Policies for quote_status_history table
CREATE POLICY "Anyone can view quote status history" ON quote_status_history
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create quote status history" ON quote_status_history
    FOR INSERT WITH CHECK (true);

-- Create storage bucket for quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quote-files', 'quote-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote files - Allow public access for now
CREATE POLICY "Anyone can upload quote files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'quote-files');

CREATE POLICY "Anyone can view quote files" ON storage.objects
    FOR SELECT USING (bucket_id = 'quote-files');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on quotes table
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create status history when quote status changes
CREATE OR REPLACE FUNCTION create_quote_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO quote_status_history (quote_id, old_status, new_status, notes)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed automatically');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status history
DROP TRIGGER IF EXISTS quote_status_change_trigger ON quotes;
CREATE TRIGGER quote_status_change_trigger
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION create_quote_status_history();
