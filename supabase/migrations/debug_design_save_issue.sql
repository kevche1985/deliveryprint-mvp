-- Debug queries to investigate the design save issue

-- 1. Check digital_products table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'digital_products' 
ORDER BY ordinal_position;
