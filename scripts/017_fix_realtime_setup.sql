-- 1. Ensure the table exists (idempotent)
-- (Already created in 013, but good for safety)

-- 2. Set Replica Identity to FULL
-- This is REQUIRED for Supabase Realtime to send the full row data on UPDATE
ALTER TABLE public.paypack_transactions REPLICA IDENTITY FULL;

-- 3. Add to supabase_realtime publication
-- We use a DO block to handle cases where the publication might not exist or the table is already added
DO $$
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add table to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'paypack_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.paypack_transactions;
  END IF;
END $$;
