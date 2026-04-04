DO $$
DECLARE
  uuid_re TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  updated_by_design_id INTEGER := 0;
  updated_by_order_id INTEGER := 0;
BEGIN
  WITH candidates AS (
    SELECT DISTINCT ON (oi.id)
      oi.id AS order_item_id,
      dp.id AS digital_product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN digital_products dp ON dp.user_id = o.user_id
    WHERE oi.digital_product_id IS NULL
      AND oi.design_id IS NOT NULL
      AND o.user_id IS NOT NULL
      AND (
        dp.id = oi.design_id
        OR (
          dp.metadata ? 'custom_design_id'
          AND (dp.metadata->>'custom_design_id') ~* uuid_re
          AND (dp.metadata->>'custom_design_id')::uuid = oi.design_id
        )
        OR (
          dp.generation_inputs ? 'custom_design_id'
          AND (dp.generation_inputs->>'custom_design_id') ~* uuid_re
          AND (dp.generation_inputs->>'custom_design_id')::uuid = oi.design_id
        )
        OR (
          dp.generated_content ? 'custom_design_id'
          AND (dp.generated_content->>'custom_design_id') ~* uuid_re
          AND (dp.generated_content->>'custom_design_id')::uuid = oi.design_id
        )
      )
    ORDER BY
      oi.id,
      (dp.download_url IS NOT NULL) DESC,
      (dp.preview_url IS NOT NULL) DESC,
      dp.created_at DESC
  )
  UPDATE order_items oi
  SET digital_product_id = c.digital_product_id
  FROM candidates c
  WHERE oi.id = c.order_item_id;
  GET DIAGNOSTICS updated_by_design_id = ROW_COUNT;

  WITH per_order_unique AS (
    SELECT
      (dp.metadata->>'order_id')::uuid AS order_id,
      (array_agg(dp.id))[1] AS digital_product_id
    FROM digital_products dp
    WHERE dp.status = 'purchased'
      AND dp.metadata ? 'order_id'
      AND (dp.metadata->>'order_id') ~* uuid_re
    GROUP BY (dp.metadata->>'order_id')::uuid
    HAVING COUNT(*) = 1
  ),
  candidates2 AS (
    SELECT oi.id AS order_item_id, u.digital_product_id
    FROM order_items oi
    JOIN per_order_unique u ON u.order_id = oi.order_id
    WHERE oi.digital_product_id IS NULL
  )
  UPDATE order_items oi
  SET digital_product_id = c.digital_product_id
  FROM candidates2 c
  WHERE oi.id = c.order_item_id;
  GET DIAGNOSTICS updated_by_order_id = ROW_COUNT;

  RAISE NOTICE 'backfill_order_items_digital_product_id: updated % rows via design_id/custom_design_id match; % rows via order_id unique match', updated_by_design_id, updated_by_order_id;
END $$;
