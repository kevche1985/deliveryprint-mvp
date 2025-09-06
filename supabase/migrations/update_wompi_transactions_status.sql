-- Add more detailed status tracking for Wompi transactions
ALTER TABLE wompi_transactions 
ADD COLUMN IF NOT EXISTS codigo_respuesta VARCHAR(10),
ADD COLUMN IF NOT EXISTS mensaje_respuesta TEXT,
ADD COLUMN IF NOT EXISTS fecha_3ds TIMESTAMP,
ADD COLUMN IF NOT EXISTS resultado_3ds VARCHAR(50);

-- Create index for faster transaction lookups
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_id_transaccion 
ON wompi_transactions(id_transaccion);

-- Create index for external ID lookups
CREATE INDEX IF NOT EXISTS idx_wompi_transactions_id_externo 
ON wompi_transactions(id_externo);

-- Update RLS policies to allow reading transaction status
CREATE POLICY IF NOT EXISTS "Users can read their own transaction status" 
ON wompi_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = wompi_transactions.id_externo 
    AND orders.user_id = auth.uid()
  )
);
