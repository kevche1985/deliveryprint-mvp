-- Debug and setup queries for design editor

-- 1. Check current digital_products table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'digital_products' 
ORDER BY ordinal_position;
