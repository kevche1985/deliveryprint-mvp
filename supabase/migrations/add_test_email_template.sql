-- Add test email template
INSERT INTO email_templates (template_key, template_name, subject_template, html_template, text_template, variables) VALUES
  (
    'test_email',
    'Test Email',
    'Test Email from DeliveryPrint System',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">DeliveryPrint</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Email System Test</p>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Email System Test</h2>
        
        <p>This is a test email from the DeliveryPrint email notification system.</p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Test Details</h3>
            <p><strong>Message:</strong> {{test_message}}</p>
            <p><strong>Sent At:</strong> {{sent_at}}</p>
        </div>
        
        <p>If you received this email, the email system is working correctly!</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 14px; color: #666;">
            Best regards,<br>
            The DeliveryPrint Team<br>
            <a href="mailto:deliveryondemand@groupdeliveryprint.com" style="color: #dc2626;">deliveryondemand@groupdeliveryprint.com</a>
        </p>
    </div>
</body>
</html>',
    'Email System Test

This is a test email from the DeliveryPrint email notification system.

Test Details:
- Message: {{test_message}}
- Sent At: {{sent_at}}

If you received this email, the email system is working correctly!

Best regards,
The DeliveryPrint Team
deliveryondemand@groupdeliveryprint.com',
    '["test_message", "sent_at"]'::jsonb
  )
ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();
