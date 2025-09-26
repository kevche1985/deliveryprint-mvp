-- Create test users for development and testing
-- These users will have different roles to test the authentication and authorization system

-- Note: In production, users should be created through the application's registration process
-- This is only for development and testing purposes

-- Insert test users into auth.users table
-- Password for all test users: 'testpass123'
-- The encrypted password is generated using Supabase's crypt function

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES 
  -- Admin User
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin", "first_name": "Admin", "last_name": "User"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  ),
  -- Customer User
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'customer@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "customer", "first_name": "John", "last_name": "Customer"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  ),
  -- Operator User
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'operator@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "operator", "first_name": "Jane", "last_name": "Operator"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  ),
  -- Supplier User
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'supplier@test.com',
    crypt('testpass123', gen_salt('bf')),
    now(),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "supplier", "first_name": "Bob", "last_name": "Supplier"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null
  )
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user profiles if the table exists
-- This assumes you have a user_profiles table for additional user information
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  phone,
  address,
  role,
  status,
  avatar_url,
  created_at,
  updated_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Admin',
    'User',
    '+1-555-0001',
    '{"street": "123 Admin St", "city": "Admin City", "state": "AC", "zip": "12345", "country": "USA"}',
    'admin',
    'active',
    null,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'John',
    'Customer',
    '+1-555-0002',
    '{"street": "456 Customer Ave", "city": "Customer City", "state": "CC", "zip": "23456", "country": "USA"}',
    'customer',
    'active',
    null,
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Jane',
    'Operator',
    '+1-555-0003',
    '{"street": "789 Operator Blvd", "city": "Operator City", "state": "OC", "zip": "34567", "country": "USA"}',
    'operator',
    'active',
    null,
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Bob',
    'Supplier',
    '+1-555-0004',
    '{"street": "321 Supplier Rd", "city": "Supplier City", "state": "SC", "zip": "45678", "country": "USA"}',
    'supplier',
    'active',
    null,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert auth.identities for the test users
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub": "11111111-1111-1111-1111-111111111111", "email": "admin@test.com", "email_verified": true, "phone_verified": false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub": "22222222-2222-2222-2222-222222222222", "email": "customer@test.com", "email_verified": true, "phone_verified": false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub": "33333333-3333-3333-3333-333333333333", "email": "operator@test.com", "email_verified": true, "phone_verified": false}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '{"sub": "44444444-4444-4444-4444-444444444444", "email": "supplier@test.com", "email_verified": true, "phone_verified": false}',
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create some sample orders for testing
INSERT INTO orders (
  id,
  order_number,
  user_id,
  email,
  status,
  subtotal,
  tax,
  shipping,
  discount,
  total,
  shipping_address,
  billing_address,
  payment_method,
  shipping_method,
  notes,
  currency,
  created_at,
  updated_at
) VALUES 
  (
    '55555555-5555-5555-5555-555555555555',
    'ORD-TEST-001',
    '22222222-2222-2222-2222-222222222222',
    'customer@test.com',
    'pending',
    25.00,
    2.50,
    5.00,
    0.00,
    32.50,
    '{"firstName": "John", "lastName": "Customer", "street": "456 Customer Ave", "city": "Customer City", "state": "CC", "zip": "23456", "country": "USA"}',
    '{"firstName": "John", "lastName": "Customer", "street": "456 Customer Ave", "city": "Customer City", "state": "CC", "zip": "23456", "country": "USA"}',
    'paypal',
    'standard',
    'Test order for development',
    'USD',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample order items
INSERT INTO order_items (
  id,
  order_id,
  product_id,
  variant_id,
  design_id,
  quantity,
  price,
  name,
  product_image_url,
  design_image_url,
  customized_image_url,
  customized_product_image_url,
  design_file_url,
  print_ready_file_url,
  customizations,
  created_at,
  updated_at
) VALUES 
  (
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555555',
    'prod-001',
    'var-005',
    null,
    1,
    25.00,
    'Standard Business Cards - 500 cards',
    '/images/products/business-cards-standard-1.jpg',
    '/images/designs/sample-business-card-design.jpg',
    '/images/designs/sample-business-card-preview.jpg',
    '/images/designs/sample-business-card-customized.jpg',
    '/files/designs/sample-business-card.pdf',
    '/files/designs/sample-business-card-print.pdf',
    '{"text": "John Customer", "title": "Software Developer", "company": "Test Company", "phone": "+1-555-0002", "email": "customer@test.com"}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Display test user credentials for reference
DO $$
BEGIN
  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE 'Login credentials (password for all: testpass123):';
  RAISE NOTICE '  Admin: admin@test.com';
  RAISE NOTICE '  Customer: customer@test.com';
  RAISE NOTICE '  Operator: operator@test.com';
  RAISE NOTICE '  Supplier: supplier@test.com';
END $$;