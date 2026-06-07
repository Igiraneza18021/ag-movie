-- Add missing INSERT policy for paypack_transactions
-- This allows authenticated users to log their own transaction attempts
CREATE POLICY "Users can insert their own transactions." ON public.paypack_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Optional: Add UPDATE policy if users need to update their own (though usually webhook handles this)
-- CREATE POLICY "Users can update their own transactions." ON public.paypack_transactions
--   FOR UPDATE USING (auth.uid() = user_id);
