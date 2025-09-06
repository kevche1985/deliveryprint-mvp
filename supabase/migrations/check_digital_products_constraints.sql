-- Check the status constraint values
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'digital_products'::regclass 
AND contype = 'c';

-- Also check the current status values in the table
SELECT DISTINCT status, COUNT(*) as count
FROM digital_products 
GROUP BY status;
