-- Add payment_transaction_id to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.payment_transaction_id IS 'Stores the transaction ID from the payment gateway (e.g., PayPal, Wompi, Stripe).';

-- Optional: Add an index if you plan to query by this ID frequently
CREATE INDEX IF NOT EXISTS idx_orders_payment_transaction_id ON public.orders(payment_transaction_id);

-- Refresh the schema cache for PostgREST (Supabase specific, might not be strictly necessary if using Supabase Studio to run)
-- For Supabase, schema changes are usually picked up automatically, but this can help in some environments.
-- NOTIFY pgrst, 'reload schema'; -- This is more for direct psql usage, Supabase handles this.
