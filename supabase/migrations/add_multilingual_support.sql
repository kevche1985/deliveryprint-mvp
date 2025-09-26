-- Migration: Add multilingual support for products and categories
-- This migration adds translation tables to support multiple languages for product content

-- Create languages table to manage supported languages
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    flag VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert supported languages
INSERT INTO languages (code, name, native_name, flag, is_active, is_default) VALUES
    ('en', 'English', 'English', '🇺🇸', true, false),
    ('es-latam', 'Spanish (LATAM)', 'Español (LATAM)', '🌎', true, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    native_name = EXCLUDED.native_name,
    flag = EXCLUDED.flag,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default;

-- Create product translations table
CREATE TABLE IF NOT EXISTS product_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, language_code)
);

-- Create category translations table
CREATE TABLE IF NOT EXISTS category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, language_code)
);

-- Create product variant translations table
CREATE TABLE IF NOT EXISTS product_variant_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, language_code)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language_code ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_language_code ON category_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_product_variant_translations_variant_id ON product_variant_translations(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_translations_language_code ON product_variant_translations(language_code);

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_translation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to translation tables
DROP TRIGGER IF EXISTS trigger_update_product_translations_updated_at ON product_translations;
CREATE TRIGGER trigger_update_product_translations_updated_at
    BEFORE UPDATE ON product_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_translation_updated_at();

DROP TRIGGER IF EXISTS trigger_update_category_translations_updated_at ON category_translations;
CREATE TRIGGER trigger_update_category_translations_updated_at
    BEFORE UPDATE ON category_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_translation_updated_at();

DROP TRIGGER IF EXISTS trigger_update_product_variant_translations_updated_at ON product_variant_translations;
CREATE TRIGGER trigger_update_product_variant_translations_updated_at
    BEFORE UPDATE ON product_variant_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_translation_updated_at();

-- Create RLS policies for translation tables
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_translations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to translations
CREATE POLICY "Public can read product translations" ON product_translations
    FOR SELECT USING (true);

CREATE POLICY "Public can read category translations" ON category_translations
    FOR SELECT USING (true);

CREATE POLICY "Public can read product variant translations" ON product_variant_translations
    FOR SELECT USING (true);

-- Allow authenticated users to manage translations (for admin purposes)
CREATE POLICY "Authenticated users can manage product translations" ON product_translations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage category translations" ON category_translations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage product variant translations" ON product_variant_translations
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON languages TO authenticated;
GRANT ALL ON product_translations TO authenticated;
GRANT ALL ON category_translations TO authenticated;
GRANT ALL ON product_variant_translations TO authenticated;

GRANT SELECT ON languages TO anon;
GRANT SELECT ON product_translations TO anon;
GRANT SELECT ON category_translations TO anon;
GRANT SELECT ON product_variant_translations TO anon;

-- Insert sample translations for existing products (if any exist)
-- This will populate Spanish translations for existing products
DO $$
DECLARE
    product_record RECORD;
    category_record RECORD;
BEGIN
    -- Translate existing products to Spanish
    FOR product_record IN SELECT id, name, description FROM products WHERE is_active = true LOOP
        -- Insert English translation (original)
        INSERT INTO product_translations (product_id, language_code, name, description, slug)
        VALUES (
            product_record.id,
            'en',
            product_record.name,
            product_record.description,
            LOWER(REPLACE(REPLACE(product_record.name, ' ', '-'), '''', ''))
        ) ON CONFLICT (product_id, language_code) DO NOTHING;
        
        -- Insert Spanish translation (basic translation)
        INSERT INTO product_translations (product_id, language_code, name, description, slug)
        VALUES (
            product_record.id,
            'es-latam',
            CASE 
                WHEN product_record.name ILIKE '%business card%' THEN 'Tarjetas de Presentación'
                WHEN product_record.name ILIKE '%flyer%' THEN 'Volantes'
                WHEN product_record.name ILIKE '%banner%' THEN 'Banners'
                WHEN product_record.name ILIKE '%sticker%' THEN 'Calcomanías'
                WHEN product_record.name ILIKE '%brochure%' THEN 'Folletos'
                ELSE product_record.name
            END,
            CASE 
                WHEN product_record.description IS NOT NULL THEN 
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        product_record.description,
                        'High-quality', 'Alta calidad'),
                        'Professional', 'Profesional'),
                        'Perfect for', 'Perfecto para'),
                        'business', 'negocios'),
                        'marketing', 'mercadeo')
                ELSE NULL
            END,
            LOWER(REPLACE(REPLACE(
                CASE 
                    WHEN product_record.name ILIKE '%business card%' THEN 'tarjetas-de-presentacion'
                    WHEN product_record.name ILIKE '%flyer%' THEN 'volantes'
                    WHEN product_record.name ILIKE '%banner%' THEN 'banners'
                    WHEN product_record.name ILIKE '%sticker%' THEN 'calcomanias'
                    WHEN product_record.name ILIKE '%brochure%' THEN 'folletos'
                    ELSE REPLACE(product_record.name, ' ', '-')
                END, '''', ''), ' ', '-'))
        ) ON CONFLICT (product_id, language_code) DO NOTHING;
    END LOOP;
    
    -- Translate existing categories to Spanish
    FOR category_record IN SELECT id, name, description FROM categories WHERE is_active = true LOOP
        -- Insert English translation (original)
        INSERT INTO category_translations (category_id, language_code, name, description, slug)
        VALUES (
            category_record.id,
            'en',
            category_record.name,
            category_record.description,
            LOWER(REPLACE(REPLACE(category_record.name, ' ', '-'), '''', ''))
        ) ON CONFLICT (category_id, language_code) DO NOTHING;
        
        -- Insert Spanish translation
        INSERT INTO category_translations (category_id, language_code, name, description, slug)
        VALUES (
            category_record.id,
            'es-latam',
            CASE 
                WHEN category_record.name ILIKE '%business card%' THEN 'Tarjetas de Presentación'
                WHEN category_record.name ILIKE '%flyer%' OR category_record.name ILIKE '%brochure%' THEN 'Volantes y Folletos'
                WHEN category_record.name ILIKE '%banner%' OR category_record.name ILIKE '%sign%' THEN 'Banners y Letreros'
                WHEN category_record.name ILIKE '%digital%' THEN 'Productos Digitales'
                WHEN category_record.name ILIKE '%sticker%' OR category_record.name ILIKE '%label%' THEN 'Calcomanías y Etiquetas'
                ELSE category_record.name
            END,
            CASE 
                WHEN category_record.description IS NOT NULL THEN 
                    REPLACE(REPLACE(REPLACE(REPLACE(
                        category_record.description,
                        'Professional', 'Profesional'),
                        'Marketing materials', 'Materiales de mercadeo'),
                        'Large format printing', 'Impresión de gran formato'),
                        'Custom', 'Personalizado')
                ELSE NULL
            END,
            LOWER(REPLACE(REPLACE(
                CASE 
                    WHEN category_record.name ILIKE '%business card%' THEN 'tarjetas-de-presentacion'
                    WHEN category_record.name ILIKE '%flyer%' OR category_record.name ILIKE '%brochure%' THEN 'volantes-y-folletos'
                    WHEN category_record.name ILIKE '%banner%' OR category_record.name ILIKE '%sign%' THEN 'banners-y-letreros'
                    WHEN category_record.name ILIKE '%digital%' THEN 'productos-digitales'
                    WHEN category_record.name ILIKE '%sticker%' OR category_record.name ILIKE '%label%' THEN 'calcomanias-y-etiquetas'
                    ELSE REPLACE(category_record.name, ' ', '-')
                END, '''', ''), ' ', '-'))
        ) ON CONFLICT (category_id, language_code) DO NOTHING;
    END LOOP;
END $$;

COMMIT;