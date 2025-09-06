-- Check if orders table exists and has data
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check for any orders in the table
SELECT COUNT(*) as total_orders FROM orders;

-- Check for the specific order
SELECT * FROM orders WHERE id = '32e21237-8af7-4d9d-bbbb-78cebba10b2a';
