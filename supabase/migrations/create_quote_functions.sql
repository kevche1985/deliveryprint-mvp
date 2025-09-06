-- Function to get quote statistics
CREATE OR REPLACE FUNCTION get_quote_statistics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_quotes', (SELECT COUNT(*) FROM quotes),
        'new_quotes', (SELECT COUNT(*) FROM quotes WHERE status = 'new'),
        'pending_quotes', (SELECT COUNT(*) FROM quotes WHERE status IN ('pending', 'in_review')),
        'completed_quotes', (SELECT COUNT(*) FROM quotes WHERE status IN ('accepted', 'approved')),
        'quotes_by_service', (
            SELECT json_object_agg(service_type, count)
            FROM (
                SELECT service_type, COUNT(*) as count
                FROM quotes
                GROUP BY service_type
            ) service_counts
        ),
        'quotes_by_urgency', (
            SELECT json_object_agg(urgency_level, count)
            FROM (
                SELECT urgency_level, COUNT(*) as count
                FROM quotes
                GROUP BY urgency_level
            ) urgency_counts
        ),
        'recent_quotes', (
            SELECT COUNT(*) FROM quotes 
            WHERE created_at >= NOW() - INTERVAL '7 days'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search quotes with full-text search
CREATE OR REPLACE FUNCTION search_quotes(search_term TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    quote_number VARCHAR,
    customer_name VARCHAR,
    customer_email VARCHAR,
    service_type VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.quote_number,
        q.customer_name,
        q.customer_email,
        q.service_type,
        q.status,
        q.created_at,
        ts_rank(
            to_tsvector('english', 
                COALESCE(q.customer_name, '') || ' ' ||
                COALESCE(q.customer_email, '') || ' ' ||
                COALESCE(q.customer_company, '') || ' ' ||
                COALESCE(q.quote_number, '') || ' ' ||
                COALESCE(q.request_description, '')
            ),
            plainto_tsquery('english', search_term)
        ) as rank
    FROM quotes q
    WHERE to_tsvector('english', 
        COALESCE(q.customer_name, '') || ' ' ||
        COALESCE(q.customer_email, '') || ' ' ||
        COALESCE(q.customer_company, '') || ' ' ||
        COALESCE(q.quote_number, '') || ' ' ||
        COALESCE(q.request_description, '')
    ) @@ plainto_tsquery('english', search_term)
    ORDER BY rank DESC, q.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quotes requiring attention (urgent, overdue, etc.)
CREATE OR REPLACE FUNCTION get_quotes_requiring_attention()
RETURNS TABLE (
    id UUID,
    quote_number VARCHAR,
    customer_name VARCHAR,
    service_type VARCHAR,
    urgency_level VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    days_old INTEGER,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.quote_number,
        q.customer_name,
        q.service_type,
        q.urgency_level,
        q.status,
        q.created_at,
        EXTRACT(DAY FROM NOW() - q.created_at)::INTEGER as days_old,
        CASE 
            WHEN q.urgency_level = 'rush' AND q.status = 'new' THEN 'Rush quote needs immediate attention'
            WHEN q.urgency_level = 'urgent' AND q.status = 'new' AND q.created_at < NOW() - INTERVAL '4 hours' THEN 'Urgent quote overdue'
            WHEN q.status = 'new' AND q.created_at < NOW() - INTERVAL '24 hours' THEN 'Quote response overdue'
            WHEN q.status = 'quote_sent' AND q.created_at < NOW() - INTERVAL '7 days' THEN 'Quote awaiting customer response'
            WHEN q.valid_until < NOW() AND q.status NOT IN ('accepted', 'declined', 'expired') THEN 'Quote expired'
            ELSE 'Requires follow-up'
        END as reason
    FROM quotes q
    WHERE 
        (q.urgency_level = 'rush' AND q.status = 'new') OR
        (q.urgency_level = 'urgent' AND q.status = 'new' AND q.created_at < NOW() - INTERVAL '4 hours') OR
        (q.status = 'new' AND q.created_at < NOW() - INTERVAL '24 hours') OR
        (q.status = 'quote_sent' AND q.created_at < NOW() - INTERVAL '7 days') OR
        (q.valid_until < NOW() AND q.status NOT IN ('accepted', 'declined', 'expired'))
    ORDER BY 
        CASE q.urgency_level 
            WHEN 'rush' THEN 1 
            WHEN 'urgent' THEN 2 
            ELSE 3 
        END,
        q.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
