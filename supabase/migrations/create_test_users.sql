-- Create test users for different roles
-- Note: In a real environment, you would use proper password hashing
-- These are just for testing purposes

-- Create admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', NOW(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create operator user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'operator@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', NOW(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create customer user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'customer@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', NOW(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create user profiles for each user
INSERT INTO public.user_profiles (id, first_name, last_name, email, role, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'User', 'admin@example.com', 'admin', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Operator', 'User', 'operator@example.com', 'operator', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Customer', 'User', 'customer@example.com', 'customer', 'active')
ON CONFLICT (id) DO NOTHING;
