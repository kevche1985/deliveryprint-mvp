-- Create email_settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'resend',
  api_key TEXT,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255),
  email_enabled BOOLEAN DEFAULT false,
  max_retry_attempts INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 5,
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
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key VARCHAR(100),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  message_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);

-- Enable RLS
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_settings
CREATE POLICY "Admin can manage email settings" ON email_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT email FROM profiles WHERE role = 'admin'
      )
    )
  );

-- Create RLS policies for email_templates
CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT email FROM profiles WHERE role = 'admin'
      )
    )
  );

-- Create RLS policies for email_logs
CREATE POLICY "Admin can view email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        SELECT email FROM profiles WHERE role = 'admin'
      )
    )
  );

-- Insert default email templates
INSERT INTO email_templates (
  template_key,
  template_name,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES 
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .success-message { background-color: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info-box { background-color: #f8f9fa; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
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
            <div class="success-message">
                <strong>Test Message:</strong> {{test_message}}
            </div>
            <div class="info-box">
                <p><strong>Sent At:</strong> {{timestamp}}</p>
                <p><strong>Template:</strong> test_email</p>
                <p><strong>System Status:</strong> Operational</p>
            </div>
            <p>This email confirms that your email system is working correctly!</p>
            <p><a href="{{admin_url}}" style="color: #dc2626;">Return to Admin Panel</a></p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
  'Test Email from DeliveryPrint

✅ EMAIL TEST SUCCESSFUL!

Test Message: {{test_message}}
Sent At: {{timestamp}}
Template: test_email
System Status: Operational

This email confirms that your email system is working correctly!

Admin Panel: {{admin_url}}

© 2024 DeliveryPrint. All rights reserved.',
  ARRAY['test_message', 'timestamp', 'admin_url'],
  true
),
(
  'order_confirmation',
  'Order Confirmation',
  'Order Confirmation #{{order_number}} - DeliveryPrint',
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
        .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint</h1>
            <p>Order Confirmation</p>
        </div>
        <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Hi {{customer_name}},</p>
            <p>We have received your order and are processing it now. You will receive another email when your order ships.</p>
            <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> {{order_number}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Total Amount:</strong> ${{total_amount}}</p>
                <p><strong>Payment Method:</strong> {{payment_method}}</p>
                <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
            </div>
            <p><a href="{{order_url}}" class="button">View Order Details</a></p>
            <p>If you have any questions about your order, please contact our customer service team.</p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
  'Order Confirmation #{{order_number}} - DeliveryPrint

Thank you for your order!

Hi {{customer_name}},

We have received your order and are processing it now.

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: ${{total_amount}}
- Payment Method: {{payment_method}}
- Estimated Delivery: {{estimated_delivery}}

View your order: {{order_url}}

You will receive another email when your order ships.

© 2024 DeliveryPrint. All rights reserved.',
  ARRAY['customer_name', 'order_number', 'order_date', 'total_amount', 'payment_method', 'estimated_delivery', 'order_url'],
  true
),
(
  'quote_submitted',
  'Quote Request Received',
  'Quote Request Received - DeliveryPrint',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote Request Received</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .urgency-high { background-color: #fee2e2; color: #991b1b; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint</h1>
            <p>Quote Request Received</p>
        </div>
        <div class="content">
            <h2>We received your quote request!</h2>
            <p>Hi {{customer_name}},</p>
            <p>Thank you for your interest in our services. We have received your quote request and will get back to you within 24 hours.</p>
            <div class="quote-details">
                <h3>Quote Details</h3>
                <p><strong>Quote Number:</strong> {{quote_number}}</p>
                <p><strong>Service:</strong> {{service_type}}</p>
                <p><strong>Request Date:</strong> {{created_date}}</p>
                <p><strong>Urgency Level:</strong> {{urgency_level}}</p>
            </div>
            <p>If you have any urgent questions, please contact us directly.</p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
  'Quote Request Received - DeliveryPrint

We received your quote request!

Hi {{customer_name}},

Thank you for your interest in our services. We have received your quote request and will get back to you within 24 hours.

Quote Details:
- Quote Number: {{quote_number}}
- Service: {{service_type}}
- Request Date: {{created_date}}
- Urgency Level: {{urgency_level}}

If you have any urgent questions, please contact us directly.

© 2024 DeliveryPrint. All rights reserved.',
  ARRAY['customer_name', 'quote_number', 'service_type', 'created_date', 'urgency_level'],
  true
),
(
  'admin_new_quote',
  'New Quote Request - Admin Notification',
  'New Quote Request #{{quote_number}} - {{urgency_level}} Priority',
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
        .quote-details { background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .urgency-high { background-color: #fee2e2; color: #991b1b; padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DeliveryPrint Admin</h1>
            <p>New Quote Request</p>
        </div>
        <div class="content">
            <h2>New Quote Request Received</h2>
            <div class="quote-details">
                <h3>Quote Information</h3>
                <p><strong>Quote Number:</strong> {{quote_number}}</p>
                <p><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p>
                <p><strong>Service Type:</strong> {{service_type}}</p>
                <p><strong>Request Date:</strong> {{created_date}}</p>
                <p><strong>Urgency Level:</strong> {{urgency_level}}</p>
            </div>
            <div class="quote-details">
                <h3>Request Description</h3>
                <p>{{request_description}}</p>
            </div>
            <p>
                <a href="{{admin_quote_url}}" class="button">View Quote Details</a>
                <a href="{{admin_dashboard_url}}" class="button">Admin Dashboard</a>
            </p>
        </div>
        <div class="footer">
            <p>© 2024 DeliveryPrint Admin Panel</p>
        </div>
    </div>
</body>
</html>',
  'New Quote Request #{{quote_number}} - {{urgency_level}} Priority

New Quote Request Received

Quote Information:
- Quote Number: {{quote_number}}
- Customer: {{customer_name}} ({{customer_email}})
- Service Type: {{service_type}}
- Request Date: {{created_date}}
- Urgency Level: {{urgency_level}}

Request Description:
{{request_description}}

Admin Quote URL: {{admin_quote_url}}
Admin Dashboard: {{admin_dashboard_url}}

© 2024 DeliveryPrint Admin Panel',
  ARRAY['quote_number', 'customer_name', 'customer_email', 'service_type', 'created_date', 'urgency_level', 'request_description', 'admin_quote_url', 'admin_dashboard_url'],
  true
) ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
