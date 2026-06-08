CREATE TABLE IF NOT EXISTS public.watchlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('movie', 'tv')),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
  watch_status TEXT NOT NULL DEFAULT 'not_set' CHECK (
    watch_status IN ('not_set', 'watching', 'planning', 'completed', 're_watching', 'paused', 'dropped')
  ),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  start_date DATE,
  end_date DATE,
  total_rewatched INTEGER NOT NULL DEFAULT 0 CHECK (total_rewatched >= 0),
  notes TEXT,
  liked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT watchlist_entries_target_check CHECK (
    (item_type = 'movie' AND movie_id IS NOT NULL AND tv_show_id IS NULL) OR
    (item_type = 'tv' AND tv_show_id IS NOT NULL AND movie_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_entries_user_movie
  ON public.watchlist_entries(user_id, movie_id)
  WHERE movie_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_watchlist_entries_user_tv_show
  ON public.watchlist_entries(user_id, tv_show_id)
  WHERE tv_show_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_watchlist_entries_user_id
  ON public.watchlist_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_watchlist_entries_updated_at
  ON public.watchlist_entries(updated_at DESC);

ALTER TABLE public.watchlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watchlist entries." ON public.watchlist_entries;
DROP POLICY IF EXISTS "Users can insert their own watchlist entries." ON public.watchlist_entries;
DROP POLICY IF EXISTS "Users can update their own watchlist entries." ON public.watchlist_entries;
DROP POLICY IF EXISTS "Users can delete their own watchlist entries." ON public.watchlist_entries;

CREATE POLICY "Users can view their own watchlist entries." ON public.watchlist_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist entries." ON public.watchlist_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist entries." ON public.watchlist_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist entries." ON public.watchlist_entries
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_watchlist_entries_updated_at ON public.watchlist_entries;

CREATE TRIGGER update_watchlist_entries_updated_at
  BEFORE UPDATE ON public.watchlist_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
