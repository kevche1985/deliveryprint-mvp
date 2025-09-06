-- Update digital_products status constraint to include 'purchased'
-- Drop the existing constraint
ALTER TABLE digital_products DROP CONSTRAINT IF EXISTS digital_products_status_check;

-- Add the new constraint with 'purchased' included
ALTER TABLE digital_products ADD CONSTRAINT digital_products_status_check 
CHECK (status::text = ANY (ARRAY['generating'::character varying, 'generated'::character varying, 'failed'::character varying, 'purchased'::character varying]::text[]));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'digital_products_status_check';
