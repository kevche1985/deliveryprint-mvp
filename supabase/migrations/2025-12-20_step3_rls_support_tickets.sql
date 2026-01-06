ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'st_sr_all' AND polrelid = 'public.support_tickets'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY st_sr_all ON public.support_tickets
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'st_user_insert' AND polrelid = 'public.support_tickets'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY st_user_insert ON public.support_tickets
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid())
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'st_user_select' AND polrelid = 'public.support_tickets'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY st_user_select ON public.support_tickets
      FOR SELECT TO authenticated
      USING (user_id = auth.uid())
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'st_admin_select' AND polrelid = 'public.support_tickets'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY st_admin_select ON public.support_tickets
      FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','operator')))
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'st_admin_mod' AND polrelid = 'public.support_tickets'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY st_admin_mod ON public.support_tickets
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','operator')))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','operator')))
    $$;
  END IF;
END $$;
