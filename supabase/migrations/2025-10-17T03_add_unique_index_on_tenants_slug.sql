-- Ensure unique slugs for tenants to avoid collisions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'tenants_slug_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX tenants_slug_unique_idx ON public.tenants (slug);
  END IF;
END $$;