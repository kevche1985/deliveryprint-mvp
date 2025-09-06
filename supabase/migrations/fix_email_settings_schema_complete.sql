-- Drop and recreate the email_settings table with the correct schema
DROP TABLE IF EXISTS email_settings CASCADE;

-- Create the email_settings table with all required columns
CREATE TABLE email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'resend',
    api_key TEXT,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_password TEXT,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) NOT NULL DEFAULT 'DeliveryPrint',
    admin_email VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    email_enabled BOOLEAN DEFAULT false,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_settings_updated_at 
    BEFORE UPDATE ON email_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_email_settings_updated_at();

-- Insert default settings
INSERT INTO email_settings (
    provider,
    api_key,
    from_email,
    from_name,
    admin_email,
    is_active,
    email_enabled
) VALUES (
    'resend',
    '',
    'onboarding@resend.dev',
    'DeliveryPrint',
    '',
    false,
    false
);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage email settings" ON email_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Allow service role to manage all email data
CREATE POLICY "Service role can manage email settings" ON email_settings FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
);

-- Create email_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Enable RLS for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_logs
CREATE POLICY "Admin can view email logs" ON email_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can manage email logs" ON email_logs FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
);

-- Create email_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_templates
CREATE POLICY "Admin can manage email templates" ON email_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can manage email templates" ON email_templates FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
);

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject_template, html_template, text_template, variables) VALUES
('order_confirmation', 'Order Confirmation', 'Order Confirmation - {{order_number}}', 
'<h1>Thank you for your order!</h1>
<p>Dear {{customer_name}},</p>
<p>Your order <strong>{{order_number}}</strong> has been confirmed.</p>
<p><strong>Order Details:</strong></p>
<ul>
<li>Order Date: {{order_date}}</li>
<li>Total Amount: ${{total_amount}}</li>
<li>Payment Method: {{payment_method}}</li>
<li>Estimated Delivery: {{estimated_delivery}}</li>
</ul>
<p>You can track your order status at: <a href="{{order_url}}">{{order_url}}</a></p>
<p>Thank you for choosing DeliveryPrint!</p>',
'Thank you for your order!

Dear {{customer_name}},

Your order {{order_number}} has been confirmed.

Order Details:
- Order Date: {{order_date}}
- Total Amount: ${{total_amount}}
- Payment Method: {{payment_method}}
- Estimated Delivery: {{estimated_delivery}}

You can track your order status at: {{order_url}}

Thank you for choosing DeliveryPrint!',
ARRAY['customer_name', 'order_number', 'order_date', 'total_amount', 'payment_method', 'estimated_delivery', 'order_url']),

('quote_submitted', 'Quote Request Submitted', 'Quote Request Submitted - {{quote_number}}',
'<h1>Quote Request Received</h1>
<p>Dear {{customer_name}},</p>
<p>We have received your quote request <strong>{{quote_number}}</strong> for {{service_type}}.</p>
<p><strong>Request Details:</strong></p>
<ul>
<li>Quote Number: {{quote_number}}</li>
<li>Service Type: {{service_type}}</li>
<li>Submission Date: {{created_date}}</li>
<li>Urgency Level: {{urgency_level}}</li>
</ul>
<p>We will review your request and get back to you within 24 hours.</p>
<p>You can check the status of your quote at: <a href="{{quote_url}}">{{quote_url}}</a></p>
<p>Thank you for choosing DeliveryPrint!</p>',
'Quote Request Received

Dear {{customer_name}},

We have received your quote request {{quote_number}} for {{service_type}}.

Request Details:
- Quote Number: {{quote_number}}
- Service Type: {{service_type}}
- Submission Date: {{created_date}}
- Urgency Level: {{urgency_level}}

We will review your request and get back to you within 24 hours.

You can check the status of your quote at: {{quote_url}}

Thank you for choosing DeliveryPrint!',
ARRAY['customer_name', 'quote_number', 'service_type', 'created_date', 'urgency_level', 'quote_url']),

('admin_new_quote', 'New Quote Request - Admin Notification', 'New Quote Request - {{quote_number}}',
'<h1>New Quote Request</h1>
<p>A new quote request has been submitted:</p>
<p><strong>Quote Details:</strong></p>
<ul>
<li>Quote Number: {{quote_number}}</li>
<li>Customer: {{customer_name}} ({{customer_email}})</li>
<li>Service Type: {{service_type}}</li>
<li>Urgency Level: {{urgency_level}}</li>
<li>Submission Date: {{created_date}}</li>
</ul>
<p><strong>Description:</strong></p>
<p>{{request_description}}</p>
<p><a href="{{admin_quote_url}}">View Quote in Admin Panel</a></p>
<p><a href="{{admin_dashboard_url}}">Go to Admin Dashboard</a></p>',
'New Quote Request

A new quote request has been submitted:

Quote Details:
- Quote Number: {{quote_number}}
- Customer: {{customer_name}} ({{customer_email}})
- Service Type: {{service_type}}
- Urgency Level: {{urgency_level}}
- Submission Date: {{created_date}}

Description:
{{request_description}}

View Quote in Admin Panel: {{admin_quote_url}}
Go to Admin Dashboard: {{admin_dashboard_url}}',
ARRAY['quote_number', 'customer_name', 'customer_email', 'service_type', 'urgency_level', 'created_date', 'request_description', 'admin_quote_url', 'admin_dashboard_url']),

('test_email', 'Test Email', 'Test Email from DeliveryPrint',
'<h1>Test Email</h1>
<p>This is a test email from DeliveryPrint to verify your email configuration is working correctly.</p>
<p>If you received this email, your email settings are configured properly!</p>
<p>Sent at: {{sent_time}}</p>',
'Test Email

This is a test email from DeliveryPrint to verify your email configuration is working correctly.

If you received this email, your email settings are configured properly!

Sent at: {{sent_time}}',
ARRAY['sent_time'])

ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    subject_template = EXCLUDED.subject_template,
    html_template = EXCLUDED.html_template,
    text_template = EXCLUDED.text_template,
    variables = EXCLUDED.variables,
    updated_at = NOW();
