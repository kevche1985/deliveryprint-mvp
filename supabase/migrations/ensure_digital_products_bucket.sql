-- Ensure the digital-products storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Set up RLS policies for the digital-products bucket
CREATE POLICY IF NOT EXISTS "Users can upload their own designs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can view their own designs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Public can view digital products" ON storage.objects
FOR SELECT USING (bucket_id = 'digital-products');

-- Allow service role to manage all files
CREATE POLICY IF NOT EXISTS "Service role can manage all digital products" ON storage.objects
FOR ALL USING (bucket_id = 'digital-products');
