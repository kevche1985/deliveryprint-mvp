DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'id'
      AND data_type = 'uuid'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category_id'
  ) THEN
    INSERT INTO products (id, name, description, price, category_id, image, is_active, is_featured, created_at, updated_at)
    VALUES
      (
        'digital-print-couche-100',
        'COUCHE 100 - Digital Printing',
        'Digital printing service for COUCHE 100 paper.',
        1.25,
        'cat-002',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/COUCHE.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-foldcote-12',
        'FOLDCOTE 12 - Digital Printing',
        'Digital printing service for FOLDCOTE 12 paper.',
        1.25,
        'cat-002',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/Folcote_2.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-bond',
        'BOND - Digital Printing',
        'Digital printing service for BOND paper.',
        0.50,
        'cat-002',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/PAPEL%20BOND.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-adhesivo',
        'ADHESIVO - Digital Printing',
        'Digital printing service for ADHESIVO material.',
        2.00,
        'cat-005',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/ADHESIVO.jpg',
        true,
        false,
        now(),
        now()
      )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO products (id, name, description, price, category, image, is_active, is_featured, created_at, updated_at)
    VALUES
      (
        'digital-print-couche-100',
        'COUCHE 100 - Digital Printing',
        'Digital printing service for COUCHE 100 paper.',
        1.25,
        'Flyers & Brochures',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/COUCHE.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-foldcote-12',
        'FOLDCOTE 12 - Digital Printing',
        'Digital printing service for FOLDCOTE 12 paper.',
        1.25,
        'Flyers & Brochures',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/Folcote_2.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-bond',
        'BOND - Digital Printing',
        'Digital printing service for BOND paper.',
        0.50,
        'Flyers & Brochures',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/PAPEL%20BOND.jpg',
        true,
        false,
        now(),
        now()
      ),
      (
        'digital-print-adhesivo',
        'ADHESIVO - Digital Printing',
        'Digital printing service for ADHESIVO material.',
        2.00,
        'Stickers & Labels',
        'https://dzlqddocovzijnfwygap.supabase.co/storage/v1/object/public/web-images/ADHESIVO.jpg',
        true,
        false,
        now(),
        now()
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
