-- Disputes schema and policies

CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  reason text NOT NULL,
  description text,
  amount_requested numeric(12,2) NOT NULL DEFAULT 0,
  amount_approved numeric(12,2),
  payment_provider text,
  payment_capture_id text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.dispute_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  filename text NOT NULL,
  path text NOT NULL,
  mime_type text,
  size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dispute_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dp_sr_all' AND polrelid = 'public.disputes'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dp_sr_all ON public.disputes FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'df_sr_all' AND polrelid = 'public.dispute_files'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY df_sr_all ON public.dispute_files FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dc_sr_all' AND polrelid = 'public.dispute_comments'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dc_sr_all ON public.dispute_comments FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dp_user_insert' AND polrelid = 'public.disputes'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dp_user_insert ON public.disputes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dp_user_select' AND polrelid = 'public.disputes'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dp_user_select ON public.disputes FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dp_admin_select' AND polrelid = 'public.disputes'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dp_admin_select ON public.disputes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN (''admin'',''operator'')))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dp_admin_update' AND polrelid = 'public.disputes'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dp_admin_update ON public.disputes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN (''admin'',''operator''))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN (''admin'',''operator'')))';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'df_user_insert' AND polrelid = 'public.dispute_files'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY df_user_insert ON public.dispute_files FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_files.dispute_id AND d.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'df_user_select' AND polrelid = 'public.dispute_files'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY df_user_select ON public.dispute_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_files.dispute_id AND d.user_id = auth.uid()))';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'df_admin_select' AND polrelid = 'public.dispute_files'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY df_admin_select ON public.dispute_files FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN (''admin'',''operator'')))';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dc_user_insert' AND polrelid = 'public.dispute_comments'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dc_user_insert ON public.dispute_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'dc_user_select' AND polrelid = 'public.dispute_comments'::regclass
  ) THEN
    EXECUTE 'CREATE POLICY dc_user_select ON public.dispute_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.disputes d WHERE d.id = dispute_comments.dispute_id AND (d.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN (''admin'',''operator'')))) )';
  END IF;
END $$;
