-- Create digital products table
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('logo', 'image', 'font')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  generation_inputs JSONB,
  generated_content JSONB,
  preview_url TEXT,
  download_url TEXT,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital orders table
CREATE TABLE IF NOT EXISTS digital_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'delivered')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending',
  billing_address JSONB,
  currency VARCHAR(3) DEFAULT 'USD',
  download_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital order items table
CREATE TABLE IF NOT EXISTS digital_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES digital_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES digital_products(id),
  name VARCHAR(255) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  selected_formats JSONB NOT NULL DEFAULT '[]',
  selected_license VARCHAR(50) NOT NULL DEFAULT 'personal',
  format_options JSONB NOT NULL DEFAULT '[]',
  license_options JSONB NOT NULL DEFAULT '[]',
  final_price DECIMAL(10,2) NOT NULL,
  download_ready BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digital downloads table
CREATE TABLE IF NOT EXISTS digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES digital_order_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  download_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  format VARCHAR(10) NOT NULL,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);
