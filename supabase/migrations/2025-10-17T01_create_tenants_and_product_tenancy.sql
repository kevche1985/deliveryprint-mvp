-- Phase 1: Multi-tenancy base (tenants + product tables)
-- Shared-schema approach with tenant_id on key entities

BEGIN;

-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_url text,
  brand_bg_color text,
  brand_ui_color text,
  email_from text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed default tenant "primary"
INSERT INTO public.tenants (slug, name, brand_bg_color, brand_ui_color)
VALUES ('primary', 'Primary', '#ffffff', '#111827')
ON CONFLICT (slug) DO NOTHING;

-- User profile active tenant
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active_tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.user_profiles
SET active_tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE active_tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_tenant ON public.user_profiles(active_tenant_id);

-- Products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.products
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);

-- Product variants
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.product_variants pv
SET tenant_id = p.tenant_id
FROM public.products p
WHERE pv.product_id = p.id
  AND pv.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_tenant ON public.product_variants(tenant_id);

-- Product images
ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.product_images pi
SET tenant_id = p.tenant_id
FROM public.products p
WHERE pi.product_id = p.id
  AND pi.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_images_tenant ON public.product_images(tenant_id);

-- Basic RLS for tenants (public read, admin manage)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'public_read_tenants'
  ) THEN
    CREATE POLICY public_read_tenants ON public.tenants
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'admin_manage_tenants'
  ) THEN
    CREATE POLICY admin_manage_tenants ON public.tenants
      FOR ALL
      USING (EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'admin'
      ));
  END IF;
END$$;

COMMIT;