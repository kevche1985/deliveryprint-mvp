-- Create digital_downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS digital_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL DEFAULT 'PNG',
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 10,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digital_downloads_user_id ON digital_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_order_id ON digital_downloads(order_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_design_id ON digital_downloads(design_id);

-- Enable RLS
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own downloads" ON digital_downloads;
CREATE POLICY "Users can view their own downloads" ON digital_downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own download counts" ON digital_downloads;
CREATE POLICY "Users can update their own download counts" ON digital_downloads
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to insert downloads
DROP POLICY IF EXISTS "Service role can insert downloads" ON digital_downloads;
CREATE POLICY "Service role can insert downloads" ON digital_downloads
  FOR INSERT WITH CHECK (true);

-- Create a function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(download_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE digital_downloads 
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = download_id 
    AND auth.uid() = user_id 
    AND download_count < max_downloads
    AND (expires_at IS NULL OR expires_at > NOW());
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
