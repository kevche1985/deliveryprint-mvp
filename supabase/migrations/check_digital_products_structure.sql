-- Check if digital_products table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'digital_products' 
ORDER BY ordinal_position;
