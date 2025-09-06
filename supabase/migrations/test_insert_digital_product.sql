-- First, let's get a valid user ID from auth.users
DO $$
DECLARE
    test_user_id uuid;
    insert_result record;
BEGIN
    -- Get the first available user ID
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Using test user ID: %', test_user_id;
    
    -- Try to insert a minimal test record
    BEGIN
        INSERT INTO digital_products (
            user_id,
            type,
            name,
            description,
            base_price,
            generation_inputs,
            generated_content,
            preview_url,
            download_url,
            metadata,
            status
        ) VALUES (
            test_user_id,
            'image',
            'Test Design',
            'Test description',
            0,
            '{"test": true}'::jsonb,
            '{"test": true}'::jsonb,
            'https://example.com/preview.png',
            'https://example.com/download.png',
            '{"test": true}'::jsonb,
            'unpurchased'
        ) RETURNING id, name, status;
        
        RAISE NOTICE 'SUCCESS: Test record inserted successfully';
        
        -- Clean up the test record
        DELETE FROM digital_products WHERE name = 'Test Design' AND user_id = test_user_id;
        RAISE NOTICE 'Test record cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'INSERT FAILED: % - %', SQLSTATE, SQLERRM;
        RAISE NOTICE 'Error detail: %', SQLERRM;
    END;
END $$;

-- Also check if there are any triggers on the table that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'digital_products';
