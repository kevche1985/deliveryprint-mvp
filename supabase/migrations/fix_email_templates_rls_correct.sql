-- Fix RLS policies for email templates using the correct user_profiles table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "email_templates_select_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_insert_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_update_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_delete_policy" ON email_templates;
DROP POLICY IF EXISTS "email_templates_server_access" ON email_templates;

-- Create new policies that allow server operations and admin access
CREATE POLICY "email_templates_select_policy" ON email_templates
    FOR SELECT USING (true);

CREATE POLICY "email_templates_insert_policy" ON email_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "email_templates_update_policy" ON email_templates
    FOR UPDATE USING (
        -- Allow if user is admin or if it's a server operation (no auth context)
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_templates_delete_policy" ON email_templates
    FOR DELETE USING (
        -- Only allow admins to delete templates
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Fix email_settings policies
DROP POLICY IF EXISTS "email_settings_select_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_insert_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_update_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_delete_policy" ON email_settings;
DROP POLICY IF EXISTS "email_settings_server_access" ON email_settings;

CREATE POLICY "email_settings_select_policy" ON email_settings
    FOR SELECT USING (
        -- Allow admins or server operations
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_settings_insert_policy" ON email_settings
    FOR INSERT WITH CHECK (
        -- Allow admins or server operations
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_settings_update_policy" ON email_settings
    FOR UPDATE USING (
        -- Allow admins or server operations
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_settings_delete_policy" ON email_settings
    FOR DELETE USING (
        -- Only allow admins to delete settings
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Fix email_logs policies
DROP POLICY IF EXISTS "email_logs_select_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_insert_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_update_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_delete_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_server_access" ON email_logs;

CREATE POLICY "email_logs_select_policy" ON email_logs
    FOR SELECT USING (
        -- Allow admins or server operations
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_logs_insert_policy" ON email_logs
    FOR INSERT WITH CHECK (true); -- Allow all inserts for logging

CREATE POLICY "email_logs_update_policy" ON email_logs
    FOR UPDATE USING (
        -- Allow admins or server operations
        auth.uid() IS NULL OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "email_logs_delete_policy" ON email_logs
    FOR DELETE USING (
        -- Only allow admins to delete logs
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT ON email_templates TO authenticated;
GRANT SELECT ON email_settings TO authenticated;
GRANT SELECT ON email_logs TO authenticated;

-- Grant full permissions to service_role (for server operations)
GRANT ALL ON email_templates TO service_role;
GRANT ALL ON email_settings TO service_role;
GRANT ALL ON email_logs TO service_role;
