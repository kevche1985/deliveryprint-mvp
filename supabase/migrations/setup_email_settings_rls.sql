-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage email_settings" ON email_settings;
DROP POLICY IF EXISTS "Authenticated users can read email_settings" ON email_settings;
DROP POLICY IF EXISTS "Authenticated users can manage email_settings" ON email_settings;
DROP POLICY IF EXISTS "Service role can manage email_logs" ON email_logs;
DROP POLICY IF EXISTS "Authenticated users can read email_logs" ON email_logs;

-- Enable RLS on email_settings table
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on email_logs table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for email_settings table
CREATE POLICY "Service role can manage email_settings" ON email_settings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can read email_settings" ON email_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage email_settings" ON email_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for email_logs table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
        CREATE POLICY "Service role can manage email_logs" ON email_logs
            FOR ALL USING (auth.role() = 'service_role');
        
        CREATE POLICY "Authenticated users can read email_logs" ON email_logs
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Ensure email_settings table exists with proper structure
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) DEFAULT 'resend',
    resend_api_key TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    admin_email VARCHAR(255),
    email_enabled BOOLEAN DEFAULT false,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure email_logs table exists
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email settings if none exist
INSERT INTO email_settings (provider, email_enabled)
SELECT 'resend', false
WHERE NOT EXISTS (SELECT 1 FROM email_settings);
