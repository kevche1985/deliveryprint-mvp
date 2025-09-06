-- Clean up any test digital products that might be causing issues
DELETE FROM digital_products 
WHERE name LIKE '%test%' 
   OR name LIKE '%Test%'
   OR description LIKE '%test%'
   OR created_at < NOW() - INTERVAL '1 day';

-- Clean up any orphaned storage files (this is informational - actual cleanup would need to be done via API)
SELECT 
  'Storage cleanup needed for: ' || name as cleanup_info,
  metadata->>'storage_path' as storage_path
FROM digital_products 
WHERE status = 'unpurchased' 
  AND created_at < NOW() - INTERVAL '1 hour';

-- Verify the digital_products table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'digital_products' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any constraint violations
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.digital_products'::regclass;
