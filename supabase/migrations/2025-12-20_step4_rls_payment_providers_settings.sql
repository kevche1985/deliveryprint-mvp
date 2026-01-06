-- Step 4: RLS on payment_providers and payment_settings (medium impact)

-- payment_providers
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pp_sr_all' AND polrelid = 'public.payment_providers'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pp_sr_all ON public.payment_providers
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pp_admin_select' AND polrelid = 'public.payment_providers'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pp_admin_select ON public.payment_providers
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pp_admin_mod' AND polrelid = 'public.payment_providers'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pp_admin_mod ON public.payment_providers
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
    $$;
  END IF;
END $$;

-- payment_settings
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'ps_sr_all' AND polrelid = 'public.payment_settings'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY ps_sr_all ON public.payment_settings
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'ps_admin_select' AND polrelid = 'public.payment_settings'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY ps_admin_select ON public.payment_settings
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'ps_admin_mod' AND polrelid = 'public.payment_settings'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY ps_admin_mod ON public.payment_settings
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role IN ('admin','operator')
        )
      )
    $$;
  END IF;
END $$;

-- Validation hints:
-- 1) Anonymous cannot read/write providers or settings
-- 2) Admin/operator can read and manage; server continues to operate
-- 3) Application code should use supabaseServer for writes

