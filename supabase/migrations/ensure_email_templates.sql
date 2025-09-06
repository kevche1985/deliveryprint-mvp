-- Ensure email templates table exists and has test template
INSERT INTO email_templates (
  template_key,
  template_name,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
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
) ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Add other common email templates
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
            <p>We have received your order and are processing it now.</p>
            <div class="order-details">
                <p><strong>Order Number:</strong> {{order_number}}</p>
                <p><strong>Order Date:</strong> {{order_date}}</p>
                <p><strong>Total Amount:</strong> {{total_amount}}</p>
            </div>
            <p>You will receive another email when your order ships.</p>
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
- Total Amount: {{total_amount}}

You will receive another email when your order ships.

© 2024 DeliveryPrint. All rights reserved.',
  ARRAY['customer_name', 'order_number', 'order_date', 'total_amount'],
  true
),
(
  'quote_received',
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
                <p><strong>Service:</strong> {{service_type}}</p>
                <p><strong>Request Date:</strong> {{request_date}}</p>
                <p><strong>Description:</strong> {{description}}</p>
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
- Service: {{service_type}}
- Request Date: {{request_date}}
- Description: {{description}}

If you have any urgent questions, please contact us directly.

© 2024 DeliveryPrint. All rights reserved.',
  ARRAY['customer_name', 'service_type', 'request_date', 'description'],
  true
) ON CONFLICT (template_key) DO NOTHING;
