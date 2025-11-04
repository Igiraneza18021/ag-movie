"use client"

import { notFound, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { EpisodePlayer } from "@/components/episode-player"
import { createClient } from "@/lib/supabase/client"
import type { TVShow, Episode } from "@/lib/types"

interface WatchTVPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ season?: string; episode?: string }>
}

export default function WatchTVPage({ params, searchParams }: WatchTVPageProps) {
  const [tvShow, setTVShow] = useState<TVShow | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [nextEpisode, setNextEpisode] = useState<Episode | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = await params
        const { season, episode } = await searchParams

        const supabase = createClient()
        
        // Load TV show
        const { data: showData, error: showError } = await supabase
          .from("tv_shows")
          .select("*")
          .eq("id", id)
          .eq("status", "active")
          .single()

        if (showError || !showData) {
          notFound()
          return
        }

        setTVShow(showData)

        // Load episodes
        const { data: episodesData, error: episodesError } = await supabase
          .from("episodes")
          .select("*")
          .eq("tv_show_id", id)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true })

        if (episodesError) {
          console.error("Error loading episodes:", episodesError)
          return
        }

        const episodes = episodesData || []
        
        // Find the requested episode
        const seasonNumber = season ? parseInt(season) : 1
        const episodeNumber = episode ? parseInt(episode) : 1

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
          notFound()
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
        notFound()
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params, searchParams, router])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!tvShow || !selectedEpisode) {
    notFound()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 w-full h-full overflow-hidden">
      <EpisodePlayer episode={selectedEpisode} tvShow={tvShow} nextEpisode={nextEpisode} autoPlay={true} />
    </div>
  )
}

