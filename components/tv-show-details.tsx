"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SpotlightSection } from "@/components/details/spotlight-section"
import { BackdropGallery } from "@/components/details/backdrop-gallery"
import { CategorySection } from "@/components/details/category-section"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { TVShow, Episode, Season } from "@/lib/types"
import Link from "next/link"
import { Play, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TVShowDetailsProps {
  tvShow: TVShow
  seasons?: Season[]
  episodes?: Episode[]
  relatedShows?: TVShow[]
}

export function TVShowDetails({ tvShow, seasons = [], episodes = [], relatedShows = [] }: TVShowDetailsProps) {
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>(episodes)
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [episodeSearchQuery, setEpisodeSearchQuery] = useState("")
  const [showAllEpisodes, setShowAllEpisodes] = useState(false)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "episodes" | "more">("overview")
  const router = useRouter()
  const searchParams = useSearchParams()
  const showDownloads = searchParams.get("dl") === "1"

  // Load episodes if not provided
  useEffect(() => {
    const loadEpisodes = async () => {
      if (episodes.length > 0) return
      setEpisodesLoading(true)
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from("episodes")
          .select("*")
          .eq("tv_show_id", tvShow.id)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true })

        if (error) throw error
        setAllEpisodes(data || [])
      } catch (error) {
        console.error("Failed to load episodes:", error)
      } finally {
        setEpisodesLoading(false)
      }
    }
    loadEpisodes()
  }, [tvShow.id, episodes])

  // Get unique seasons from episodes
  const uniqueSeasons = Array.from(new Set(allEpisodes.map((ep) => ep.season_number))).sort((a, b) => a - b)
  const availableSeasons = seasons.length > 0 ? seasons : uniqueSeasons.map((num) => ({ season_number: num } as Season))

  // Set initial season
  useEffect(() => {
    if (uniqueSeasons.length > 0 && selectedSeason === 1) {
      const firstSeason = uniqueSeasons.find((s) => s > 0) || uniqueSeasons[0]
      setSelectedSeason(firstSeason)
    }
  }, [uniqueSeasons])

  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeason(seasonNum)
    setEpisodeSearchQuery("")
    setShowAllEpisodes(false)
  }

  // Filter and sort episodes
  const filteredEpisodes = allEpisodes.filter((episode) => {
    if (episode.season_number !== selectedSeason) return false
    const searchQuery = episodeSearchQuery.toLowerCase()
    return (
      episode.name?.toLowerCase().includes(searchQuery) ||
      episode.overview?.toLowerCase().includes(searchQuery) ||
      episode.episode_number?.toString().includes(searchQuery)
    )
  })

  const sortedEpisodes = [...filteredEpisodes].sort((a, b) => {
    if (sortOrder === "asc") {
      return a.episode_number - b.episode_number
    } else {
      return b.episode_number - a.episode_number
    }
  })

  const displayEpisodes = showAllEpisodes ? sortedEpisodes : sortedEpisodes.slice(0, 5)
  const firstEpisodeName = allEpisodes.find((ep) => ep.season_number === selectedSeason)?.name || ""

  // Create backdrop images array
  const backdropImages = tvShow.backdrop_path ? [{ file_path: tvShow.backdrop_path }] : []

  const handleWatchClick = () => {
    const firstEpisode = allEpisodes.find((ep) => ep.season_number === selectedSeason)
    if (firstEpisode) {
      router.push(`/watch/tv/${tvShow.id}?season=${selectedSeason}&episode=${firstEpisode.episode_number}`)
    }
  }

  const handleTrailerClick = () => {
    setShowTrailerModal(true)
  }

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      {/* Spotlight/Hero Section */}
      <SpotlightSection
        item={tvShow}
        mediaType="tv"
        isLoading={false}
        onWatchClick={handleWatchClick}
        onTrailerClick={handleTrailerClick}
        showDownloads={showDownloads}
      />

      {/* Tab Navigation */}
      {!showDownloads && (
        <div className="px-8 pt-6">
          <div className="flex gap-2 border-b border-gray-700 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "overview"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Overview
            </button>

            {uniqueSeasons.length > 0 && (
              <button
                onClick={() => setActiveTab("episodes")}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "episodes"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Episodes
              </button>
            )}

            {relatedShows.length > 0 && (
              <button
                onClick={() => setActiveTab("more")}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "more"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                More Like This
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-8 pb-8 pt-6">
        {showDownloads ? (
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Downloads</h2>
            {tvShow.download_url ? (
              <a
                href={tvShow.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#E50914] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B20710] transition-colors"
              >
                <Download className="w-5 h-5" />
                Download TV Show
              </a>
            ) : (
              <p className="text-gray-400">No download links available.</p>
            )}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Backdrop Gallery */}
                {backdropImages.length > 0 && (
                  <BackdropGallery title="Images" images={backdropImages} item={tvShow} />
                )}
              </>
            )}

            {/* Episodes Tab */}
            {activeTab === "episodes" && uniqueSeasons.length > 0 && (
              <>
                {/* Header with blue accent */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                  <h2 className="text-3xl font-bold text-white">Episodes</h2>
                </div>

                {/* Episodes Controls */}
                <div className="bg-[#242424] rounded-xl p-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Season Dropdown */}
                    <div className="flex-shrink-0">
                      <select
                        value={selectedSeason}
                        onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                        className="bg-[#3A3A3A] text-white px-4 py-3 rounded-lg border-0 focus:border-blue-500 focus:outline-none min-w-[140px] hover:bg-[#404040] transition-colors"
                      >
                        {uniqueSeasons
                          .filter((s) => s > 0)
                          .map((seasonNum) => (
                            <option key={seasonNum} value={seasonNum}>
                              Season {seasonNum}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search episode..."
                        value={episodeSearchQuery}
                        onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                        className="w-full bg-[#3A3A3A] text-white px-12 py-3 rounded-lg border-0 focus:border-blue-500 focus:outline-none hover:bg-[#404040] transition-colors placeholder-gray-400"
                      />
                    </div>

                    {/* Sort Button */}
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="bg-[#3A3A3A] text-white p-3 rounded-lg border-0 hover:bg-[#404040] transition-colors"
                      title={sortOrder === "asc" ? "Sort Descending" : "Sort Ascending"}
                    >
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Episodes List */}
                <div className="bg-[#242424] rounded-xl p-4">
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-600 hover:scrollbar-thumb-blue-400">
                    <div className="space-y-4">
                      {displayEpisodes.map((episode, index) => (
                        <div
                          key={episode.id || index}
                          className="bg-[#2D2D2D] rounded-lg p-3 hover:bg-[#333333] transition-colors cursor-pointer"
                          onClick={() => {
                            router.push(
                              `/watch/tv/${tvShow.id}?season=${episode.season_number}&episode=${episode.episode_number}`
                            )
                          }}
                        >
                          <div className="flex gap-3">
                            {/* Episode Thumbnail */}
                            <div className="relative flex-shrink-0">
                              <div className="w-24 h-16 bg-gray-600 rounded-lg overflow-hidden">
                                {episode.still_path ? (
                                  <img
                                    src={getTMDBImageUrl(episode.still_path)}
                                    alt={episode.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                                    <Play className="w-3 h-3 text-black ml-0.5" fill="currentColor" />
                                  </div>
                                </div>
                                {/* Episode Number */}
                                <div className="absolute -bottom-1 -left-1 bg-black text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                                  {episode.episode_number}
                                </div>
                              </div>
                            </div>

                            {/* Episode Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                                {episode.name || `Episode ${episode.episode_number}`}
                              </h3>
                              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                                {episode.overview || "No description available."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Show More Button */}
                      {sortedEpisodes.length > 5 && !showAllEpisodes && (
                        <button
                          onClick={() => setShowAllEpisodes(true)}
                          className="w-full bg-[#2D2D2D] text-white py-4 rounded-lg border-0 hover:bg-[#333333] transition-colors mt-4"
                        >
                          Show More Episodes ({sortedEpisodes.length - 5} remaining)
                        </button>
                      )}

                      {/* Show Less Button */}
                      {sortedEpisodes.length > 5 && showAllEpisodes && (
                        <button
                          onClick={() => setShowAllEpisodes(false)}
                          className="w-full bg-[#2D2D2D] text-white py-4 rounded-lg border-0 hover:bg-[#333333] transition-colors mt-4"
                        >
                          Show Less
                        </button>
                      )}

                      {/* No Results */}
                      {sortedEpisodes.length === 0 && episodeSearchQuery && (
                        <div className="text-center py-8 text-gray-400">No episodes found for "{episodeSearchQuery}"</div>
                      )}

                      {/* Loading State */}
                      {episodesLoading && (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* More Like This Tab */}
            {activeTab === "more" && relatedShows.length > 0 && (
              <CategorySection
                title="More Like This"
                items={relatedShows}
                isLoading={false}
                renderItem={(item) => (
                  <Link href={`/tv/${item.id}`} className="block">
                    <div className="relative group cursor-pointer">
                      <img
                        src={getTMDBImageUrl(item.poster_path, "w342") || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full aspect-[2/3] object-cover rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-sm line-clamp-2">{item.name}</h3>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
                layout="horizontal"
              />
            )}
          </>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && tvShow.trailer_url && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="relative bg-black/95 rounded-xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-white/10 mx-auto my-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-black/50 backdrop-blur-sm">
              <h3 className="text-white text-lg md:text-xl font-semibold">Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-white hover:text-red-400 hover:bg-white/10 transition-all duration-200 p-2 rounded-full group cursor-pointer relative z-30"
              >
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={tvShow.trailer_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Trailer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
