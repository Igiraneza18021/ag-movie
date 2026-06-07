export interface Movie {
  id: string
  tmdb_id: number
  title: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  runtime?: number
  vote_average?: number
  vote_count?: number
  genres: Genre[]
  trailer_url?: string
  embed_url: string
  download_url?: string
  part_number?: number
  parent_movie_id?: string
  narrator?: string
  status: "active" | "inactive" | "coming_soon"
  scheduled_release?: string
  created_at: string
  updated_at: string
}

export interface TVShow {
  id: string
  tmdb_id: number
  name: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  first_air_date?: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
  vote_average?: number
  vote_count?: number
  genres: Genre[]
  trailer_url?: string
  download_url?: string
  narrator?: string
  status: "active" | "inactive" | "coming_soon"
  scheduled_release?: string
  created_at: string
  updated_at: string
}

export interface Season {
  id: string
  tv_show_id: string
  tmdb_id: number
  season_number: number
  name: string
  overview?: string
  poster_path?: string
  air_date?: string
  episode_count?: number
  created_at: string
}

export interface Episode {
  id: string
  season_id: string
  tv_show_id: string
  tmdb_id: number
  episode_number: number
  season_number: number
  name: string
  overview?: string
  still_path?: string
  air_date?: string
  runtime?: number
  vote_average?: number
  vote_count?: number
  embed_url: string
  download_url?: string
  created_at: string
}

export interface Genre {
  id: string
  tmdb_id: number
  name: string
  created_at: string
}

export interface MovieRequest {
  id: string
  title: string
  type: "movie" | "tv_show"
  year?: number
  description?: string
  requester_email: string
  requester_phone?: string
  status: "pending" | "in_progress" | "completed" | "rejected"
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date: string
  runtime: number
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string
  backdrop_path: string
  first_air_date: string
  last_air_date: string
  number_of_seasons: number
  number_of_episodes: number
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
}

export interface MovieRoom {
  id: string
  room_code: string
  movie_id?: string
  episode_id?: string
  created_by: string
  room_name?: string
  is_active: boolean
  max_participants: number
  current_participants: number
  playback_position: number
  is_playing: boolean
  playback_speed: number
  last_activity: string
  created_at: string
  updated_at: string
}

export interface RoomParticipant {
  id: string
  room_id: string
  participant_id: string
  participant_name?: string
  is_host: boolean
  joined_at: string
  last_seen: string
}

export interface RoomMessage {
  id: string
  room_id: string
  participant_id: string
  participant_name?: string
  message: string
  timestamp: string
}

export type WatchlistItemType = "movie" | "tv"

export type WatchStatus =
  | "not_set"
  | "watching"
  | "planning"
  | "completed"
  | "re_watching"
  | "paused"
  | "dropped"

export interface WatchlistMediaSummary {
  id: string
  type: WatchlistItemType
  title: string
  poster_path?: string | null
  vote_average?: number | null
  release_date?: string | null
  first_air_date?: string | null
  number_of_episodes?: number | null
}

export interface WatchlistEntry {
  id: string
  user_id: string
  item_type: WatchlistItemType
  movie_id?: string | null
  tv_show_id?: string | null
  watch_status: WatchStatus
  progress: number
  score: number | null
  start_date: string | null
  end_date: string | null
  total_rewatched: number
  notes: string | null
  liked: boolean
  created_at: string
  updated_at: string
  live_progress: WatchProgressEntry | TVShowProgressEntry | null
  media: WatchlistMediaSummary
}

export interface WatchlistSaveInput {
  entryId?: string
  item: WatchlistMediaSummary
  watch_status: WatchStatus
  progress: number
  score: number | null
  start_date: string | null
  end_date: string | null
  total_rewatched: number
  notes: string
  liked: boolean
}

export interface WatchProgressEntry {
  id?: string
  user_id: string
  content_type: "movie" | "episode"
  movie_id?: string | null
  tv_show_id?: string | null
  season_id?: string | null
  episode_id?: string | null
  progress_seconds: number
  duration_seconds: number | null
  progress_percent: number | null
  is_completed: boolean
  started_at: string | null
  last_watched_at: string
  completed_at: string | null
  rewatch_count: number
  created_at?: string
  updated_at?: string
}

export interface TVShowProgressEntry {
  id?: string
  user_id: string
  tv_show_id: string
  started_at: string | null
  last_watched_at: string
  completed_episode_count: number
  total_episode_count_snapshot: number
  progress_percent: number
  is_completed: boolean
  rewatch_count: number
  completed_at: string | null
  created_at?: string
  updated_at?: string
}
