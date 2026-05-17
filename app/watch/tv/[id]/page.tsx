"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { EpisodePlayer } from "@/components/episode-player"
import { createClient } from "@/lib/supabase/client"
import { isTransientFetchError, runSupabaseQueryWithRetry } from "@/lib/supabase/retry"
import type { TVShow, Episode } from "@/lib/types"

export default function WatchTVPage() {
  const [tvShow, setTVShow] = useState<TVShow | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [nextEpisode, setNextEpisode] = useState<Episode | undefined>(undefined)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError("")
      setTVShow(null)
      setSelectedEpisode(null)
      setNextEpisode(undefined)
      setEpisodes([])

      try {
        const id = params.id

        const supabase = createClient()
        
        // Load TV show
        const { data: showData, error: showError } = await runSupabaseQueryWithRetry<TVShow>(() =>
          supabase
            .from("tv_shows")
            .select("*")
            .eq("id", id)
            .eq("status", "active")
            .maybeSingle(),
        )

        if (showError || !showData) {
          setError("TV show was not found or is not available.")
          return
        }

        setTVShow(showData)

        // Load episodes
        const { data: episodesData, error: episodesError } = await runSupabaseQueryWithRetry<Episode[]>(() =>
          supabase
            .from("episodes")
            .select("*")
            .eq("tv_show_id", id)
            .order("season_number", { ascending: true })
            .order("episode_number", { ascending: true }),
        )

        if (episodesError) {
          console.error("Error loading episodes:", episodesError)
          setError("Episodes could not be loaded.")
          return
        }

        const episodes = episodesData || []
        setEpisodes(episodes)
        
        // Find the requested episode
        const seasonNumber = Number(searchParams.get("season") || 1)
        const episodeNumber = Number(searchParams.get("episode") || 1)

        const episodeFound = episodes.find(
          (ep) => ep.season_number === seasonNumber && ep.episode_number === episodeNumber
        )

        if (!episodeFound) {
          // If episode not found, redirect to first episode
          if (episodes.length > 0) {
            const firstEp = episodes[0]
            router.replace(`/watch/tv/${id}?season=${firstEp.season_number}&episode=${firstEp.episode_number}`)
            return
          }
          setError("No episodes are available for this show.")
          return
        }

        setSelectedEpisode(episodeFound)

        // Find next episode
        const next = episodes.find(
          (ep) =>
            ep.season_number === seasonNumber &&
            ep.episode_number === episodeNumber + 1
        ) || episodes.find(
          (ep) =>
            ep.season_number === seasonNumber + 1 &&
            ep.episode_number === 1
        )

        setNextEpisode(next)
      } catch (error) {
        console.error("Error loading watch data:", error)
        setError(
          isTransientFetchError(error)
            ? "The TV show service is temporarily unreachable. Please refresh in a moment."
            : "This episode could not be loaded.",
        )
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id, router, searchParams])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!tvShow || !selectedEpisode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center text-white">
          <h1 className="text-2xl font-semibold">Episode unavailable</h1>
          <p className="mt-3 text-sm text-white/70">{error || "This episode could not be found."}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 w-full h-full overflow-hidden">
      <EpisodePlayer
        episode={selectedEpisode}
        tvShow={tvShow}
        nextEpisode={nextEpisode}
        episodes={episodes}
        autoPlay={true}
      />
    </div>
  )
}
