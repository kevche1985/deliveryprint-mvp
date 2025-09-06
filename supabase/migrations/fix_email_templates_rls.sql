-- Fix RLS policies for email templates to allow server operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "email_templates_select_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_delete_policy" ON email_templates;

-- Create new policies that allow server operations
CREATE POLICY "email_templates_select_policy" ON email_templates
    FOR SELECT USING (true);

CREATE POLICY "email_templates_insert_policy" ON email_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "email_templates_update_policy" ON email_templates
    FOR UPDATE USING (true);

CREATE POLICY "email_templates_delete_policy" ON email_templates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                SELECT email FROM user_roles 
                WHERE role = 'admin'
            )
        )
    );

-- Also fix email_settings policies
DROP POLICY IF EXISTS "email_settings_select_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_insert_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_update_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_delete_policy" ON email_settings;

CREATE POLICY "email_settings_select_policy" ON email_settings
    FOR SELECT USING (true);

CREATE POLICY "email_settings_insert_policy" ON email_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "email_settings_update_policy" ON email_settings
    FOR UPDATE USING (true);

CREATE POLICY "email_settings_delete_policy" ON email_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                SELECT email FROM user_roles 
                WHERE role = 'admin'
            )
        )
    );

-- Fix email_logs policies
DROP POLICY IF EXISTS "email_logs_select_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_insert_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_update_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_delete_policy" ON email_logs;

CREATE POLICY "email_logs_select_policy" ON email_logs
    FOR SELECT USING (true);

CREATE POLICY "email_logs_insert_policy" ON email_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "email_logs_update_policy" ON email_logs
    FOR UPDATE USING (true);

CREATE POLICY "email_logs_delete_policy" ON email_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN (
                SELECT email FROM user_roles 
                WHERE role = 'admin'
            )
        )
    );
