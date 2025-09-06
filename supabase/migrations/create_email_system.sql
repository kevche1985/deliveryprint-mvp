-- Create email_settings table
CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    template_data JSONB DEFAULT '{}'::jsonb,
    priority INTEGER DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject TEXT,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_settings_key ON email_settings(setting_key);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_settings_updated_at BEFORE UPDATE ON email_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default email settings
INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('smtp_host', 'send.one.com', 'SMTP server hostname'),
('smtp_port', '465', 'SMTP server port'),
('smtp_secure', 'true', 'Use SSL/TLS encryption'),
('smtp_username', '', 'SMTP authentication username'),
('smtp_password', '', 'SMTP authentication password'),
('from_email', 'deliveryondemand@groupdeliveryprint.com', 'Default from email address'),
('from_name', 'DeliveryPrint', 'Default from name'),
('reply_to_email', 'deliveryondemand@groupdeliveryprint.com', 'Default reply-to email address'),
('no_reply_email', 'no-reply@groupdeliveryprint.com', 'No-reply email address'),
('admin_email', 'admin@groupdeliveryprint.com', 'Admin notification email'),
('email_enabled', 'false', 'Enable/disable email notifications'),
('max_retry_attempts', '3', 'Maximum retry attempts for failed emails'),
('retry_delay_minutes', '5', 'Delay between retry attempts in minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject_template, html_template, text_template, variables) VALUES
(
    'test_email',
    'Test Email',
    'Test Email from DeliveryPrint - {{timestamp}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            background-color: #dc2626; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold; 
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
        }
        .content { 
            padding: 40px 30px; 
            background-color: white; 
        }
        .content h2 { 
            color: #dc2626; 
            margin-top: 0; 
            font-size: 24px; 
        }
        .info-box { 
            background-color: #f8f9fa; 
            border-left: 4px solid #dc2626; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 4px; 
        }
        .success-message { 
            background-color: #d4edda; 
            color: #155724; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0; 
            border: 1px solid #c3e6cb; 
        }
        .footer { 
            padding: 20px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            background-color: #f8f9fa; 
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #dc2626;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint</h1>
            <p>Email System Test</p>
        </div>
        <div class="content">
            <h2>✅ Email Test Successful!</h2>
            
            <p>Congratulations! Your email system is working correctly.</p>
            
            <div class="success-message">
                <strong>Test Message:</strong> {{test_message}}
            </div>
            
            <div class="info-box">
                <h3>Test Details:</h3>
                <p><strong>Sent At:</strong> {{timestamp}}</p>
                <p><strong>Template:</strong> test_email</p>
                <p><strong>System Status:</strong> Operational</p>
            </div>
            
            <p>This email confirms that:</p>
            <ul>
                <li>✅ SMTP configuration is correct</li>
                <li>✅ Email templates are working</li>
                <li>✅ Database connection is active</li>
                <li>✅ Email delivery is functional</li>
            </ul>
            
            <p>You can now confidently use the email system for customer notifications, order confirmations, and other automated communications.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{admin_url}}" class="button">Return to Admin Panel</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
            <p>This is an automated test email from your DeliveryPrint system.</p>
        </div>
    </div>
</body>
</html>',
    'Test Email from DeliveryPrint

✅ EMAIL TEST SUCCESSFUL!

Congratulations! Your email system is working correctly.

Test Message: {{test_message}}

Test Details:
- Sent At: {{timestamp}}
- Template: test_email
- System Status: Operational

This email confirms that:
✅ SMTP configuration is correct
✅ Email templates are working
✅ Database connection is active
✅ Email delivery is functional

You can now confidently use the email system for customer notifications, order confirmations, and other automated communications.

Admin Panel: {{admin_url}}

© 2024 DeliveryPrint. All rights reserved.
This is an automated test email from your DeliveryPrint system.',
    '["test_message", "timestamp", "admin_url"]'::jsonb
),
(
    'quote_submitted',
    'Quote Request Submitted',
    'Quote Request #{{quote_number}} Submitted Successfully',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote Request Submitted</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #dc2626; margin-top: 0; }
        .info-box { background-color: #f8f9fa; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint</h1>
            <p>Professional Printing Services</p>
        </div>
        <div class="content">
            <h2>Quote Request Submitted</h2>
            <p>Dear {{customer_name}},</p>
            <p>Thank you for submitting your quote request. We have received your request and will process it shortly.</p>
            
            <div class="info-box">
                <h3>Quote Details:</h3>
                <p><strong>Quote Number:</strong> {{quote_number}}</p>
                <p><strong>Service Type:</strong> {{service_type}}</p>
                <p><strong>Submitted:</strong> {{created_date}}</p>
                <p><strong>Urgency:</strong> {{urgency_level}}</p>
            </div>
            
            <p>We will review your request and provide a detailed quote within 24-48 hours.</p>
            
            <div style="text-align: center;">
                <a href="{{quote_url}}" class="button">View Quote Status</a>
            </div>
            
            <p>If you have any questions, please don''t hesitate to contact us.</p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Quote Request Submitted - DeliveryPrint

Dear {{customer_name}},

Thank you for submitting your quote request. We have received your request and will process it shortly.

Quote Details:
- Quote Number: {{quote_number}}
- Service Type: {{service_type}}
- Submitted: {{created_date}}
- Urgency: {{urgency_level}}

We will review your request and provide a detailed quote within 24-48 hours.

View your quote status: {{quote_url}}

If you have any questions, please don''t hesitate to contact us.

© 2024 DeliveryPrint. All rights reserved.',
    '["customer_name", "quote_number", "service_type", "created_date", "urgency_level", "quote_url"]'::jsonb
),
(
    'admin_new_quote',
    'New Quote Request - Admin Notification',
    'New Quote Request #{{quote_number}} - {{urgency_level}}',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Quote Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .info-box { background-color: #f8f9fa; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
        .urgent { background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint Admin</h1>
            <p>New Quote Request Alert</p>
        </div>
        <div class="content">
            <h2>New Quote Request</h2>
            
            <div class="info-box">
                <h3>Quote Details:</h3>
                <p><strong>Quote Number:</strong> {{quote_number}}</p>
                <p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p>
                <p><strong>Service Type:</strong> {{service_type}}</p>
                <p><strong>Submitted:</strong> {{created_date}}</p>
                <p><strong>Urgency:</strong> <span class="urgent">{{urgency_level}}</span></p>
            </div>
            
            <h3>Request Description:</h3>
            <p>{{request_description}}</p>
            
            <div style="text-align: center;">
                <a href="{{admin_quote_url}}" class="button">Review Quote Request</a>
                <a href="{{admin_dashboard_url}}" class="button">Admin Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint Admin System</p>
        </div>
    </div>
</body>
</html>',
    'New Quote Request - DeliveryPrint Admin

Quote Details:
- Quote Number: {{quote_number}}
- Customer: {{customer_name}} ({{customer_email}})
- Service Type: {{service_type}}
- Submitted: {{created_date}}
- Urgency: {{urgency_level}}

Request Description:
{{request_description}}

Review quote request: {{admin_quote_url}}
Admin Dashboard: {{admin_dashboard_url}}

© 2024 DeliveryPrint Admin System',
    '["quote_number", "customer_name", "customer_email", "service_type", "created_date", "urgency_level", "request_description", "admin_quote_url", "admin_dashboard_url"]'::jsonb
),
(
    'order_confirmation',
    'Order Confirmation',
    'Order Confirmation #{{order_number}} - Thank You!',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .info-box { background-color: #f8f9fa; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #dc2626; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint</h1>
            <p>Professional Printing Services</p>
        </div>
        <div class="content">
            <h2>Order Confirmation</h2>
            <p>Dear {{customer_name}},</p>
            <p>Thank you for your order! We have received your payment and are processing your order.</p>
            
            <div class="info-box">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> {{order_number}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Total Amount:</strong> <span class="total">${{total_amount}}</span></p>
                <p><strong>Payment Method:</strong> {{payment_method}}</p>
                <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
            </div>
            
            <p>You will receive updates as your order progresses through production and shipping.</p>
            
            <div style="text-align: center;">
                <a href="{{order_url}}" class="button">Track Your Order</a>
            </div>
            
            <p>Thank you for choosing DeliveryPrint!</p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
    'Order Confirmation - DeliveryPrint

Dear {{customer_name}},

Thank you for your order! We have received your payment and are processing your order.

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: ${{total_amount}}
- Payment Method: {{payment_method}}
- Estimated Delivery: {{estimated_delivery}}

You will receive updates as your order progresses through production and shipping.

Track your order: {{order_url}}

Thank you for choosing DeliveryPrint!

© 2024 DeliveryPrint. All rights reserved.',
    '["customer_name", "order_number", "order_date", "total_amount", "payment_method", "estimated_delivery", "order_url"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access only for settings and templates)
CREATE POLICY "Admin can manage email settings" ON email_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can manage email templates" ON email_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view email queue" ON email_queue FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Admin can view email logs" ON email_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Allow service role to manage all email data (for API routes)
CREATE POLICY "Service role can manage email settings" ON email_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage email templates" ON email_templates FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage email queue" ON email_queue FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role can manage email logs" ON email_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
