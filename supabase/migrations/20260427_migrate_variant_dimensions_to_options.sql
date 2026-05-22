UPDATE products
SET variant_dimensions = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', d->>'name',
        'key', d->>'key',
        'options',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'value', v,
                  'price', 0,
                  'sku', NULL
                )
              )
              FROM jsonb_array_elements_text(COALESCE(d->'values', '[]'::jsonb)) AS v
            ),
            '[]'::jsonb
          )
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(products.variant_dimensions, '[]'::jsonb)) AS d
)
WHERE variant_dimensions IS NOT NULL
  AND jsonb_typeof(variant_dimensions) = 'array'
  AND (
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(variant_dimensions) AS d
      WHERE (d ? 'values') AND NOT (d ? 'options')
    )
  );
