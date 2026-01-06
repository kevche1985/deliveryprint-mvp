CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_created ON public.order_items (order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_disputes_order_user_created ON public.disputes (order_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_comments_dispute_created ON public.dispute_comments (dispute_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_files_dispute_created ON public.dispute_files (dispute_id, created_at);
