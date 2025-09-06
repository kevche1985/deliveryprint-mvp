-- Check if digital_products table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'digital_products') THEN
        -- Create the digital_products table
        CREATE TABLE public.digital_products (
            id TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('logo', 'image', 'font', 'custom_design')),
            name TEXT NOT NULL,
            description TEXT,
            file_data JSONB NOT NULL,
            generation_inputs JSONB,
            base_price DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'unpurchased' CHECK (status IN ('unpurchased', 'purchased', 'processing', 'completed', 'failed')),
            preview_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add RLS policies
        ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;

        -- Allow users to view their own digital products
        CREATE POLICY "Users can view their own digital products"
            ON public.digital_products
            FOR SELECT
            USING (auth.uid() = user_id);

        -- Allow users to insert their own digital products
        CREATE POLICY "Users can insert their own digital products"
            ON public.digital_products
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        -- Allow users to update their own digital products
        CREATE POLICY "Users can update their own digital products"
            ON public.digital_products
            FOR UPDATE
            USING (auth.uid() = user_id);

        -- Allow service role to access all digital products
        CREATE POLICY "Service role can access all digital products"
            ON public.digital_products
            USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END
$$;
