-- Create simple system settings key-value store
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admins/operators can manage all settings
DROP POLICY IF EXISTS system_settings_admin_manage ON system_settings;
CREATE POLICY system_settings_admin_manage ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin','operator')
    )
  );

-- Public can read non-sensitive settings
DROP POLICY IF EXISTS system_settings_public_read ON system_settings;
CREATE POLICY system_settings_public_read ON system_settings
  FOR SELECT USING (is_active = TRUE);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Seed performance monitor flag
INSERT INTO system_settings (key, value, is_active)
VALUES ('performance_monitor_enabled', '{"enabled": true}'::jsonb, TRUE)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_active = EXCLUDED.is_active, updated_at = NOW();

