-- Tables to support player-driven progress tracking and standalone likes.
-- watchlist_entries remains the source of truth for the watchlist card metadata
-- such as status, score, notes, dates, rewatches, and the current liked snapshot.

CREATE TABLE IF NOT EXISTS public.watch_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'episode')),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  progress_percent NUMERIC(5,2) CHECK (
    progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)
  ),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT watch_progress_entries_target_check CHECK (
    (
      content_type = 'movie' AND
      movie_id IS NOT NULL AND
      tv_show_id IS NULL AND
      season_id IS NULL AND
      episode_id IS NULL
    ) OR (
      content_type = 'episode' AND
      movie_id IS NULL AND
      tv_show_id IS NOT NULL AND
      season_id IS NOT NULL AND
      episode_id IS NOT NULL
    )
  ),
  CONSTRAINT watch_progress_entries_completion_check CHECK (
    (is_completed = FALSE AND completed_at IS NULL) OR
    (is_completed = TRUE)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_progress_entries_user_movie
  ON public.watch_progress_entries(user_id, movie_id)
  WHERE movie_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_progress_entries_user_episode
  ON public.watch_progress_entries(user_id, episode_id)
  WHERE episode_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_watch_progress_entries_user_id
  ON public.watch_progress_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_watch_progress_entries_last_watched_at
  ON public.watch_progress_entries(last_watched_at DESC);

CREATE TABLE IF NOT EXISTS public.user_content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'tv')),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_content_likes_target_check CHECK (
    (
      content_type = 'movie' AND
      movie_id IS NOT NULL AND
      tv_show_id IS NULL
    ) OR (
      content_type = 'tv' AND
      tv_show_id IS NOT NULL AND
      movie_id IS NULL
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_content_likes_user_movie
  ON public.user_content_likes(user_id, movie_id)
  WHERE movie_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_content_likes_user_tv_show
  ON public.user_content_likes(user_id, tv_show_id)
  WHERE tv_show_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_content_likes_user_id
  ON public.user_content_likes(user_id);

ALTER TABLE public.watch_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own watch progress." ON public.watch_progress_entries;
DROP POLICY IF EXISTS "Users can insert their own watch progress." ON public.watch_progress_entries;
DROP POLICY IF EXISTS "Users can update their own watch progress." ON public.watch_progress_entries;
DROP POLICY IF EXISTS "Users can delete their own watch progress." ON public.watch_progress_entries;

CREATE POLICY "Users can view their own watch progress." ON public.watch_progress_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch progress." ON public.watch_progress_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch progress." ON public.watch_progress_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch progress." ON public.watch_progress_entries
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own likes." ON public.user_content_likes;
DROP POLICY IF EXISTS "Users can insert their own likes." ON public.user_content_likes;
DROP POLICY IF EXISTS "Users can update their own likes." ON public.user_content_likes;
DROP POLICY IF EXISTS "Users can delete their own likes." ON public.user_content_likes;

CREATE POLICY "Users can view their own likes." ON public.user_content_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes." ON public.user_content_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own likes." ON public.user_content_likes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes." ON public.user_content_likes
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_watch_progress_entries_updated_at ON public.watch_progress_entries;
DROP TRIGGER IF EXISTS update_user_content_likes_updated_at ON public.user_content_likes;

CREATE TRIGGER update_watch_progress_entries_updated_at
  BEFORE UPDATE ON public.watch_progress_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_content_likes_updated_at
  BEFORE UPDATE ON public.user_content_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
