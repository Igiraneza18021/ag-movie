-- Enable Realtime for paypack_transactions table
BEGIN;
  -- Remove the table if it was already part of another publication (to avoid errors)
  -- This is a safe way to ensure it's specifically in the supabase_realtime publication
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.paypack_transactions;
COMMIT;

-- Alternative if supabase_realtime already exists:
-- ALTER PUBLICATION supabase_realtime ADD TABLE paypack_transactions;
