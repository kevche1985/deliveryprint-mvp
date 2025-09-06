-- Enable RLS on the 'product-images' bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert (upload) files
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy for authenticated users to select (view/download) files
CREATE POLICY "Allow authenticated users to view product images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

-- Optional: Policy for authenticated users to update files (if needed)
-- CREATE POLICY "Allow authenticated users to update product images"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'product-images');

-- Optional: Policy for authenticated users to delete files (if needed)
-- CREATE POLICY "Allow authenticated users to delete product images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'product-images');
