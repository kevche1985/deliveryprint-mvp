-- Step 2: Enable RLS on public.payment_transactions (medium impact)
-- Goal: Prevent public CRUD; allow server-side and admin/operator reads; optionally allow customers to read their own transactions

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access for server processes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pt_sr_all' AND polrelid = 'public.payment_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pt_sr_all ON public.payment_transactions
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $$;
  END IF;
END $$;

-- Allow admins/operators to SELECT all rows (dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pt_admin_select' AND polrelid = 'public.payment_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pt_admin_select ON public.payment_transactions
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

-- Allow customers to SELECT their own transactions via orders linkage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'pt_customer_select' AND polrelid = 'public.payment_transactions'::regclass
  ) THEN
    EXECUTE $$
      CREATE POLICY pt_customer_select ON public.payment_transactions
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = public.payment_transactions.order_id AND o.user_id = auth.uid()
        )
      )
    $$;
  END IF;
END $$;

-- Validation hints:
-- 1) Anonymous requests should not read/write payment_transactions
-- 2) Authenticated customers should see only their order-linked transactions
-- 3) Admin/operator can read all transactions; server (service_role) can insert/update/delete as needed

