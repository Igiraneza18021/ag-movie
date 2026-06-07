ALTER TABLE public.watch_progress_entries
ADD COLUMN IF NOT EXISTS rewatch_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_watch_progress_entries_user_tv_show
  ON public.watch_progress_entries(user_id, tv_show_id)
  WHERE tv_show_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tv_show_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tv_show_id UUID NOT NULL REFERENCES public.tv_shows(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_episode_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_episode_count >= 0),
  total_episode_count_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (total_episode_count_snapshot >= 0),
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (
    progress_percent >= 0 AND progress_percent <= 100
  ),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  rewatch_count INTEGER NOT NULL DEFAULT 0 CHECK (rewatch_count >= 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tv_show_progress_entries_user_show
  ON public.tv_show_progress_entries(user_id, tv_show_id);

CREATE INDEX IF NOT EXISTS idx_tv_show_progress_entries_last_watched_at
  ON public.tv_show_progress_entries(last_watched_at DESC);

ALTER TABLE public.tv_show_progress_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own TV show progress." ON public.tv_show_progress_entries;
DROP POLICY IF EXISTS "Users can insert their own TV show progress." ON public.tv_show_progress_entries;
DROP POLICY IF EXISTS "Users can update their own TV show progress." ON public.tv_show_progress_entries;
DROP POLICY IF EXISTS "Users can delete their own TV show progress." ON public.tv_show_progress_entries;

CREATE POLICY "Users can view their own TV show progress." ON public.tv_show_progress_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own TV show progress." ON public.tv_show_progress_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own TV show progress." ON public.tv_show_progress_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own TV show progress." ON public.tv_show_progress_entries
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_tv_show_progress_entries_updated_at ON public.tv_show_progress_entries;

CREATE TRIGGER update_tv_show_progress_entries_updated_at
  BEFORE UPDATE ON public.tv_show_progress_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
