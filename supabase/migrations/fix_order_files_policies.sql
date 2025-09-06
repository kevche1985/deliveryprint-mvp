-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their order files" ON order_files;
DROP POLICY IF EXISTS "Admins can manage all order files" ON order_files;

-- Recreate the policies with proper conditions
CREATE POLICY "Users can view their order files" ON order_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_files.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order files" ON order_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);
