ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS design_file_url TEXT;

COMMENT ON COLUMN public.order_items.design_file_url IS 'URL to the production-ready design file (e.g., for printing or download).';

-- Optional: If you want to backfill existing rows, you might do something like this,
-- but it depends on how you were storing this information before, if at all.
-- For new setups, this is likely not needed.
-- UPDATE public.order_items
-- SET design_file_url = NULL -- or some default value or logic to derive it
-- WHERE design_file_url IS NULL;
