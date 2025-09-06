-- Create transactions table for Wompi payments
CREATE TABLE IF NOT EXISTS wompi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_transaccion VARCHAR(255) UNIQUE, -- Wompi transaction ID
    id_externo VARCHAR(255), -- External reference ID
    monto DECIMAL(10,2) NOT NULL, -- Payment amount
    estado VARCHAR(50) NOT NULL, -- Transaction status
    es_real BOOLEAN DEFAULT TRUE, -- Production vs test transaction
    metodo_pago VARCHAR(50), -- Payment method used
    
    -- Customer Information
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    ciudad VARCHAR(255),
    direccion TEXT,
    id_pais VARCHAR(10) DEFAULT 'SV',
    id_region VARCHAR(10),
    codigo_postal VARCHAR(20),
    
    -- Card Information (only last 4 digits for security)
    ultimos_digitos_tarjeta VARCHAR(4),
    tipo_tarjeta VARCHAR(50),
    
    -- Transaction URLs
    url_redirect TEXT,
    url_completar_pago_3ds TEXT,
    
    -- Configuration
    cantidad_cuotas INTEGER,
    emails_notificacion VARCHAR(255),
    telefonos_notificacion VARCHAR(255),
    
    -- Additional data
    datos_adicionales JSONB,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_id_transaccion ON wompi_transactions(id_transaccion);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_email ON wompi_transactions(email);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_estado ON wompi_transactions(estado);
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_created_at ON wompi_transactions(created_at);

-- Create token cache table for OAuth tokens
CREATE TABLE IF NOT EXISTS wompi_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Show created tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('wompi_transactions', 'wompi_tokens')
ORDER BY table_name;
