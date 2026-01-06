-- Create services table to manage service catalog entries (admin-managed)
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow admins/operators to manage all services
DROP POLICY IF EXISTS services_admin_manage ON services;
CREATE POLICY services_admin_manage ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'operator')
        )
    );

-- Allow read access to all users for active services
DROP POLICY IF EXISTS services_public_read ON services;
CREATE POLICY services_public_read ON services
    FOR SELECT USING (is_active = TRUE);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON services;
CREATE TRIGGER trigger_update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Seed a few defaults (optional)
INSERT INTO services (name, description, category, image, price, is_active, is_featured, slug)
VALUES
('Digital Printing', 'High-resolution digital printing for flyers, brochures, and custom jobs', 'printing', NULL, 0.00, TRUE, TRUE, 'digital-printing'),
('Large Format', 'Banners and large posters with durable materials', 'printing', NULL, 0.00, TRUE, FALSE, 'large-format'),
('Event Stands', 'Portable event stands and displays', 'events', NULL, 0.00, TRUE, FALSE, 'event-stands'),
('Illuminated Signs', 'Backlit and LED signage solutions', 'signage', NULL, 0.00, TRUE, FALSE, 'illuminated-signs')
ON CONFLICT (slug) DO NOTHING;

