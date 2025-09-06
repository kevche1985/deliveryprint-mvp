-- Add order_id column to designs table
ALTER TABLE public.designs
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Add status column to designs table
ALTER TABLE public.designs
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_designs_order_id ON public.designs(order_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);

-- Add a comment to the new columns
COMMENT ON COLUMN public.designs.order_id IS 'Link to the order if this design was part of one.';
COMMENT ON COLUMN public.designs.status IS 'Status of the design (e.g., draft, in_cart, ordered, archived, template, user_saved).';

-- Backfill status for existing designs if needed (example: set to 'user_saved' if not a template and no order_id)
-- This is optional and depends on your existing data.
-- UPDATE public.designs
-- SET status = 'user_saved'
-- WHERE status IS NULL AND order_id IS NULL AND is_template = FALSE;

-- Ensure 'draft' is set for any remaining NULL statuses
UPDATE public.designs
SET status = 'draft'
WHERE status IS NULL;

-- Alter the default to be more explicit if it wasn't set correctly initially
ALTER TABLE public.designs
ALTER COLUMN status SET DEFAULT 'draft';

-- You might also want to add RLS policies for these new columns if they affect access control.
-- For example, users should only be able to see their own designs or designs linked to their orders.
-- This depends on your existing RLS setup.

-- Example: Allow users to select their own designs
-- Assuming you have a user_id column on the designs table and RLS enabled.
-- Ensure policies are in place for selecting designs based on user_id and potentially order_id.
-- (No new RLS needed just for these columns if existing policies cover row access based on user_id)

-- Grant usage on the sequence if your design IDs are serial and you haven't already
-- (This is typically for SERIAL or BIGSERIAL primary keys, UUIDs don't need this)
-- GRANT USAGE, SELECT ON SEQUENCE designs_id_seq TO authenticated, service_role;
