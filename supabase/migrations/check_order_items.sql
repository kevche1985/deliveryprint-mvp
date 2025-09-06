-- Check order_items table structure and data
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- Check if there are any order items for this specific order
SELECT * FROM order_items WHERE order_id = '32e21237-8af7-4d9d-bbbb-78cebba10b2a';

-- Check RLS policies on orders table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';

-- Check RLS policies on order_items table  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'order_items';
