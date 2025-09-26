-- Seed data for products and categories
-- This provides initial data for testing the e-commerce functionality

-- Insert categories first (referenced by products)
INSERT INTO categories (id, name, slug, description, is_active, created_at, updated_at) VALUES
  ('cat-001', 'Business Cards', 'business-cards', 'Professional business cards for networking and branding', true, now(), now()),
  ('cat-002', 'Flyers & Brochures', 'flyers-brochures', 'Marketing materials including flyers, brochures, and leaflets', true, now(), now()),
  ('cat-003', 'Banners & Signs', 'banners-signs', 'Large format printing for banners, signs, and displays', true, now(), now()),
  ('cat-004', 'Digital Products', 'digital-products', 'Digital downloads including logos, designs, and templates', true, now(), now()),
  ('cat-005', 'Stickers & Labels', 'stickers-labels', 'Custom stickers, labels, and adhesive products', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, name, description, price, category_id, image, is_active, is_featured, created_at, updated_at) VALUES
  -- Business Cards
  ('prod-001', 'Standard Business Cards', 'High-quality business cards on premium cardstock. Perfect for professional networking.', 25.00, 'cat-001', '/images/products/business-cards-standard.jpg', true, true, now(), now()),
  ('prod-002', 'Premium Business Cards', 'Luxury business cards with special finishes like foil stamping or embossing.', 45.00, 'cat-001', '/images/products/business-cards-premium.jpg', true, false, now(), now()),
  
  -- Flyers & Brochures
  ('prod-003', 'FOLDCOTE 14 - 8.5" × 11" (single-sided)', 'High-quality foldcote paper printing, perfect for professional flyers and marketing materials.', 0.75, 'cat-002', '/images/products/foldcote.jpg', true, true, now(), now()),
  ('prod-004', 'BOND - 8.5" × 11" (single-sided)', 'Standard bond paper printing for everyday flyers and documents.', 0.50, 'cat-002', '/images/products/bond.jpg', true, true, now(), now()),
  ('prod-005', 'Tri-fold Brochure', 'Professional tri-fold brochures on premium paper stock.', 2.50, 'cat-002', '/images/products/trifold-brochure.jpg', true, false, now(), now()),
  
  -- Banners & Signs
  ('prod-006', 'Vinyl Banner - Large Format', 'Durable vinyl banners for outdoor and indoor use. Weather resistant.', 45.00, 'cat-003', '/images/products/vinyl-banner.jpg', true, true, now(), now()),
  ('prod-007', 'Yard Sign - Corrugated Plastic', 'Lightweight and durable yard signs perfect for real estate and events.', 15.00, 'cat-003', '/images/products/yard-sign.jpg', true, false, now(), now()),
  
  -- Stickers & Labels
  ('prod-008', 'ADHESIVO - 8.5" × 11"', 'High-quality adhesive sticker printing on durable vinyl material.', 1.25, 'cat-005', '/images/products/adhesivo.jpg', true, true, now(), now()),
  ('prod-009', 'Custom Die-Cut Stickers', 'Custom shaped stickers cut to your exact specifications.', 2.00, 'cat-005', '/images/products/die-cut-stickers.jpg', true, false, now(), now()),
  
  -- Digital Products
  ('prod-010', 'Logo Design Package', 'Professional logo design with multiple file formats and variations.', 99.00, 'cat-004', '/images/products/logo-design.jpg', true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert product variants
INSERT INTO product_variants (id, product_id, name, sku, price, attributes, inventory, created_at, updated_at) VALUES
  -- FOLDCOTE variants
  ('var-001', 'prod-003', 'Single-sided', 'FOLD-SS-8511', 0.75, '{"sides": "single", "size": "8.5x11", "paper": "foldcote"}', 1000, now(), now()),
  ('var-002', 'prod-003', 'Double-sided', 'FOLD-DS-8511', 1.25, '{"sides": "double", "size": "8.5x11", "paper": "foldcote"}', 1000, now(), now()),
  
  -- BOND variants
  ('var-003', 'prod-004', 'Single-sided', 'BOND-SS-8511', 0.50, '{"sides": "single", "size": "8.5x11", "paper": "bond"}', 1000, now(), now()),
  ('var-004', 'prod-004', 'Double-sided', 'BOND-DS-8511', 0.85, '{"sides": "double", "size": "8.5x11", "paper": "bond"}', 1000, now(), now()),
  
  -- Business card variants
  ('var-005', 'prod-001', 'Standard - 500 cards', 'BC-STD-500', 25.00, '{"quantity": 500, "finish": "standard"}', 100, now(), now()),
  ('var-006', 'prod-001', 'Standard - 1000 cards', 'BC-STD-1000', 40.00, '{"quantity": 1000, "finish": "standard"}', 100, now(), now()),
  ('var-007', 'prod-002', 'Premium - 500 cards', 'BC-PREM-500', 45.00, '{"quantity": 500, "finish": "premium"}', 50, now(), now()),
  
  -- Banner variants
  ('var-008', 'prod-006', '3ft x 6ft', 'VB-3X6', 45.00, '{"width": "3ft", "height": "6ft", "material": "vinyl"}', 25, now(), now()),
  ('var-009', 'prod-006', '4ft x 8ft', 'VB-4X8', 65.00, '{"width": "4ft", "height": "8ft", "material": "vinyl"}', 25, now(), now()),
  
  -- Sticker variants
  ('var-010', 'prod-008', 'Single sheet', 'ADH-SS-8511', 1.25, '{"quantity": 1, "size": "8.5x11"}', 500, now(), now()),
  ('var-011', 'prod-009', 'Small (2" x 2")', 'DC-SM-2X2', 2.00, '{"size": "2x2", "shape": "custom"}', 200, now(), now()),
  ('var-012', 'prod-009', 'Medium (4" x 4")', 'DC-MD-4X4', 3.50, '{"size": "4x4", "shape": "custom"}', 200, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert product images
INSERT INTO product_images (id, product_id, url, alt_text, is_primary, display_order, created_at, updated_at) VALUES
  ('img-001', 'prod-001', '/images/products/business-cards-standard-1.jpg', 'Standard business cards front view', true, 1, now(), now()),
  ('img-002', 'prod-001', '/images/products/business-cards-standard-2.jpg', 'Standard business cards back view', false, 2, now(), now()),
  ('img-003', 'prod-003', '/images/products/foldcote-sample-1.jpg', 'Foldcote paper sample', true, 1, now(), now()),
  ('img-004', 'prod-004', '/images/products/bond-paper-sample.jpg', 'Bond paper sample', true, 1, now(), now()),
  ('img-005', 'prod-006', '/images/products/vinyl-banner-outdoor.jpg', 'Vinyl banner outdoor installation', true, 1, now(), now()),
  ('img-006', 'prod-008', '/images/products/adhesivo-sample.jpg', 'Adhesivo sticker sample', true, 1, now(), now()),
  ('img-007', 'prod-010', '/images/products/logo-design-portfolio.jpg', 'Logo design portfolio examples', true, 1, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Update product image references in products table
UPDATE products SET image = '/images/products/business-cards-standard-1.jpg' WHERE id = 'prod-001';
UPDATE products SET image = '/images/products/business-cards-premium.jpg' WHERE id = 'prod-002';
UPDATE products SET image = '/images/products/foldcote-sample-1.jpg' WHERE id = 'prod-003';
UPDATE products SET image = '/images/products/bond-paper-sample.jpg' WHERE id = 'prod-004';
UPDATE products SET image = '/images/products/trifold-brochure.jpg' WHERE id = 'prod-005';
UPDATE products SET image = '/images/products/vinyl-banner-outdoor.jpg' WHERE id = 'prod-006';
UPDATE products SET image = '/images/products/yard-sign.jpg' WHERE id = 'prod-007';
UPDATE products SET image = '/images/products/adhesivo-sample.jpg' WHERE id = 'prod-008';
UPDATE products SET image = '/images/products/die-cut-stickers.jpg' WHERE id = 'prod-009';
UPDATE products SET image = '/images/products/logo-design-portfolio.jpg' WHERE id = 'prod-010';

COMMIT;