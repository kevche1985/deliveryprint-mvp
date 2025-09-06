-- Add missing columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_company VARCHAR(255);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS request_description TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'email';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS best_contact_time VARCHAR(20) DEFAULT 'anytime';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(10,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_details TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS prefilled_data JSONB;

-- Create quote_files table
CREATE TABLE IF NOT EXISTS quote_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by VARCHAR(20) DEFAULT 'customer', -- 'customer' or 'admin'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_status_history table
CREATE TABLE IF NOT EXISTS quote_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create quote_communications table for email/communication tracking
CREATE TABLE IF NOT EXISTS quote_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    communication_type VARCHAR(20) NOT NULL, -- 'email', 'phone', 'internal_note'
    subject VARCHAR(255),
    message TEXT,
    sent_by UUID REFERENCES auth.users(id),
    sent_to VARCHAR(255), -- email address or phone number
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'delivered', 'failed'
);

-- Create storage bucket for quote files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quote-files', 'quote-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for quote_files
ALTER TABLE quote_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quote files" ON quote_files
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload files to their quotes" ON quote_files
    FOR INSERT WITH CHECK (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
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

-- RLS policies for quote_status_history
ALTER TABLE quote_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quote status history" ON quote_status_history
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
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

-- RLS policies for quote_communications
ALTER TABLE quote_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their quote communications" ON quote_communications
    FOR SELECT USING (
        quote_id IN (
            SELECT id FROM quotes WHERE customer_id = auth.uid()
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

-- Storage policies for quote files
CREATE POLICY "Users can upload quote files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'quote-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view their quote files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'quote-files' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can manage all quote files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'quote-files' AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'operator')
        )
    );

-- Update quotes status constraint to include new statuses
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
    CHECK (status IN ('new', 'pending', 'in_review', 'quote_sent', 'reviewed', 'approved', 'accepted', 'declined', 'rejected', 'cancelled', 'expired'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_service_type ON quotes(service_type);
CREATE INDEX IF NOT EXISTS idx_quotes_urgency ON quotes(urgency_level);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_files_quote_id ON quote_files(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_status_history_quote_id ON quote_status_history(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_communications_quote_id ON quote_communications(quote_id);

-- Function to automatically create status history when quote status changes
CREATE OR REPLACE FUNCTION create_quote_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO quote_status_history (quote_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
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
