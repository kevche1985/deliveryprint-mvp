-- Phase 1b: Add tenant_id to orders, cart, quotes, emails, and digital_products

BEGIN;

-- Orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.orders
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);

-- Order items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.order_items oi
SET tenant_id = o.tenant_id
FROM public.orders o
WHERE oi.order_id = o.id
  AND oi.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON public.order_items(tenant_id);

-- Cart items
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.cart_items ci
SET tenant_id = p.tenant_id
FROM public.products p
WHERE ci.product_id = p.id
  AND ci.tenant_id IS NULL;

UPDATE public.cart_items
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_cart_items_tenant ON public.cart_items(tenant_id);

-- Email settings
ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.email_settings
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_settings_tenant ON public.email_settings(tenant_id);

-- Email templates
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.email_templates
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON public.email_templates(tenant_id);

-- Quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.quotes
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON public.quotes(tenant_id);

-- Quote items
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.quote_items qi
SET tenant_id = q.tenant_id
FROM public.quotes q
WHERE qi.quote_id = q.id
  AND qi.tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_quote_items_tenant ON public.quote_items(tenant_id);

-- Digital products
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

UPDATE public.digital_products
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'primary')
WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_products_tenant ON public.digital_products(tenant_id);

COMMIT;