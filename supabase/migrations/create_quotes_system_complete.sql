-- Create quotes table with all necessary columns
CREATE TABLE IF NOT EXISTS quotes (
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
    customer_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    valid_until TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) DEFAULT 'USD',
    prefilled_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_files table for file attachments
CREATE TABLE IF NOT EXISTS quote_files (
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
CREATE TABLE IF NOT EXISTS quote_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create quote_communications table for tracking communications
CREATE TABLE IF NOT EXISTS quote_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
    communication_type VARCHAR(20) NOT NULL CHECK (communication_type IN ('email', 'phone', 'internal_note', 'sms')),
    subject VARCHAR(255),
    message TEXT,
    sent_by UUID REFERENCES auth.users(id),
    sent_to VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_urgency ON quotes(urgency_level);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quote_files_quote_id ON quote_files(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_status_history_quote_id ON quote_status_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_communications_quote_id ON quote_communications(quote_id);

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes table
CREATE POLICY "Users can view their own quotes" ON quotes
    FOR SELECT USING (
        customer_id = auth.uid() OR 
        customer_email = auth.email()
    );

CREATE POLICY "Anyone can create quotes" ON quotes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own quotes" ON quotes
    FOR UPDATE USING (
        customer_id = auth.uid() OR 
        customer_email = auth.email()
    );

CREATE POLICY "Admins can manage all quotes" ON quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for quote_files table
CREATE POLICY "Users can view their quote files" ON quote_files
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE customer_id = auth.uid() OR customer_email = auth.email()
        )
    );

CREATE POLICY "Users can upload files to their quotes" ON quote_files
    FOR INSERT WITH CHECK (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE customer_id = auth.uid() OR customer_email = auth.email()
        )
    );

CREATE POLICY "Admins can manage all quote files" ON quote_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for quote_status_history table
CREATE POLICY "Users can view their quote status history" ON quote_status_history
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE customer_id = auth.uid() OR customer_email = auth.email()
        )
    );

CREATE POLICY "Admins can manage quote status history" ON quote_status_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- RLS Policies for quote_communications table
CREATE POLICY "Users can view their quote communications" ON quote_communications
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE customer_id = auth.uid() OR customer_email = auth.email()
        )
    );

CREATE POLICY "Admins can manage quote communications" ON quote_communications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- Create storage bucket for quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quote-files', 'quote-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for quote files
CREATE POLICY "Authenticated users can upload quote files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'quote-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view quote files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'quote-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can manage all quote files in storage" ON storage.objects
    FOR ALL USING (
        bucket_id = 'quote-files' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

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
        INSERT INTO quote_status_history (quote_id, old_status, new_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), 'Status changed automatically');
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

-- Function to generate unique quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'QR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
        
        IF NOT EXISTS (SELECT 1 FROM quotes WHERE quote_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 9999 THEN
            new_number := 'QR-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 10000)::TEXT, 4, '0');
            RETURN new_number;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
