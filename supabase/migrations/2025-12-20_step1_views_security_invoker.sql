-- Step 1: Set SECURITY INVOKER on risky views (low impact)
-- This ensures views execute with the querying user's privileges and respect RLS

DO $$
BEGIN
  -- public.order_items_with_images
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'order_items_with_images'
  ) THEN
    EXECUTE 'ALTER VIEW public.order_items_with_images SET (security_invoker=on)';
  END IF;

  -- public.admin_all_products
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'admin_all_products'
  ) THEN
    EXECUTE 'ALTER VIEW public.admin_all_products SET (security_invoker=on)';
  END IF;
END $$;

-- Validation hints:
-- 1) Query these views as an authenticated user with limited access and confirm they follow RLS
-- 2) Ensure anonymous access does not leak unintended data via PostgREST

