-- Update email settings for Resend configuration
INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('provider', 'resend', 'Email service provider (resend, sendgrid)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('api_key', 're_CcP1jLet_8jAfbmqUvnfATnQ4t23D9ZXv', 'API key for email service provider')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('from_email', 'deliveryondemand@groupdeliveryprint.com', 'Default from email address')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('from_name', 'DeliveryPrint', 'Default from name')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('reply_to_email', 'deliveryondemand@groupdeliveryprint.com', 'Default reply-to email address')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

INSERT INTO email_settings (setting_key, setting_value, description) VALUES
('email_enabled', 'true', 'Enable/disable email notifications')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Remove old SMTP settings that are not needed for Resend
DELETE FROM email_settings WHERE setting_key IN (
    'smtp_host',
    'smtp_port', 
    'smtp_secure',
    'smtp_username',
    'smtp_password',
    'no_reply_email',
    'admin_email'
);
