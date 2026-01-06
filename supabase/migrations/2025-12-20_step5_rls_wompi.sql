-- Step 5: RLS on wompi tokens and transactions (higher impact for tokens)

-- wompi_tokens: highly sensitive, service_role only
ALTER TABLE public.wompi_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'wt_sr_all' AND polrelid = 'public.wompi_tokens'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY wt_sr_all ON public.wompi_tokens
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

-- No other roles get access to wompi_tokens

-- wompi_transactions: similar to payment_transactions
ALTER TABLE public.wompi_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'wtx_sr_all' AND polrelid = 'public.wompi_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY wtx_sr_all ON public.wompi_transactions
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'wtx_admin_select' AND polrelid = 'public.wompi_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY wtx_admin_select ON public.wompi_transactions
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
    SELECT 1 FROM pg_policy WHERE polname = 'wtx_customer_select' AND polrelid = 'public.wompi_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY wtx_customer_select ON public.wompi_transactions
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE (
            o.id = public.wompi_transactions.external_id
            OR o.id = public.wompi_transactions.id_externo
          )
          AND o.user_id = auth.uid()
        )
      )
    $$;
  END IF;
END $$;

-- Validation hints:
-- 1) wompi_tokens: only service_role can read/write
-- 2) wompi_transactions: customers see their own; admin/operator see all; server works

