-- Add rewatch_count to watch_progress_entries
ALTER TABLE public.watch_progress_entries 
ADD COLUMN IF NOT EXISTS rewatch_count INTEGER DEFAULT 0;

-- Comment describing the logic:
-- rewatch_count increments each time is_completed transitions from true back to false 
-- or when a completed item is restarted from the beginning.
