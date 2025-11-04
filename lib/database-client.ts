import { createClient } from "@/lib/supabase/client"
import type { Movie, TVShow, Episode, Season } from "@/lib/types"

// Client-side database functions
export async function getMovies(limit = 20, offset = 0): Promise<Movie[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "active")
    .or("part_number.is.null,part_number.eq.1") // Only show standalone movies or Part 1
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching movies:", error)
    return []
  }

  return data || []
}

export async function getTVShows(limit = 20, offset = 0): Promise<TVShow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("tv_shows")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching TV shows:", error)
    return []
  }

  return data || []
}

export async function getMovieById(id: string): Promise<Movie | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("movies").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching movie:", error)
    return null
  }

  return data
}

export async function getTVShowById(id: string): Promise<TVShow | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("tv_shows").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching TV show:", error)
    return null
  }

  return data
}

export async function getSeasonsByTVShow(tvShowId: string): Promise<Season[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("tv_show_id", tvShowId)
    .order("season_number", { ascending: true })

  if (error) {
    console.error("Error fetching seasons:", error)
    return []
  }

  return data || []
}

export async function getEpisodesByTVShow(tvShowId: string): Promise<Episode[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("tv_show_id", tvShowId)
    .order("season_number", { ascending: true })
    .order("episode_number", { ascending: true })

  if (error) {
    console.error("Error fetching episodes:", error)
    return []
  }

  return data || []
}

export async function searchContent(query: string): Promise<{ movies: Movie[]; tvShows: TVShow[] }> {
  const supabase = createClient()

  const [moviesResult, tvShowsResult] = await Promise.all([
    supabase
      .from("movies")
      .select("*")
      .eq("status", "active")
      .or("part_number.is.null,part_number.eq.1") // Only show standalone movies or Part 1
      .ilike("title", `%${query}%`)
      .limit(10),
    supabase
      .from("tv_shows")
      .select("*")
      .eq("status", "active")
      .ilike("name", `%${query}%`)
      .limit(10),
  ])

  return {
    movies: moviesResult.data || [],
    tvShows: tvShowsResult.data || [],
  }
}

