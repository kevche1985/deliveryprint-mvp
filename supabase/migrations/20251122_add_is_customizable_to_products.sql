-- Migration: Add is_customizable column to products
-- Safe to run multiple times due to IF NOT EXISTS

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_customizable boolean DEFAULT true;

-- Optional backfill in case existing rows have NULL
UPDATE public.products SET is_customizable = true WHERE is_customizable IS NULL;

COMMIT;