"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Footer } from "@/components/footer"
import { getMovies, getTVShows } from "@/lib/database-client"
import { createClient } from "@/lib/supabase/client"
import type { Movie, TVShow } from "@/lib/types"
import { SpotlightSection } from "@/components/home/spotlight-section"
import { PortraitCategoryRow } from "@/components/home/portrait-category-row"
import { Top10Section } from "@/components/home/top10-section"
import { ContinueWatchingRow } from "@/components/home/continue-watching-row"
import { TvShowHighlightCard } from "@/components/home/tv-show-highlight-card"

// Detect if user is on Mac
const isMac = () => {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent)
}

function hasContent(items: Record<string, (Movie | TVShow)[]>) {
  return Object.values(items).some((group) => group.length > 0)
}

export default function HomePage() {
  const [categoryData, setCategoryData] = useState<Record<string, (Movie | TVShow)[]>>({})
  const [spotlightItem, setSpotlightItem] = useState<Movie | TVShow | null>(null)
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([])
  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [allTVShows, setAllTVShows] = useState<TVShow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [spotlightLoading, setSpotlightLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load categories and spotlight
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setSpotlightLoading(true)
        setError(null)

        const supabase = createClient()
        
        // Get auth user first
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch movies and TV shows
        const [movies, tvShows] = await Promise.all([
          getMovies(50),
          getTVShows(50),
        ])

        setAllMovies(movies)
        setAllTVShows(tvShows)

        // Process movies for different sections
        const featuredMovies = movies.slice(0, 10)
        const newlyAddedMovies = [...movies]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20)
        const trendingMovies = [...movies]
          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          .slice(0, 20)

        // Process TV shows
        const featuredTVShows = tvShows.slice(0, 10)
        const newlyAddedTVShows = [...tvShows]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20)
        const trendingTVShows = [...tvShows]
          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          .slice(0, 20)

        // Generate Genre Categories
        const genreMap: Record<string, (Movie | TVShow)[]> = {}
        const allItems = [...movies, ...tvShows]
        
        allItems.forEach(item => {
          if (item.genres && Array.isArray(item.genres)) {
            item.genres.forEach((genre: any) => {
              let genreName = ""
              if (typeof genre === 'string') {
                genreName = genre
              } else if (genre && genre.name) {
                genreName = genre.name
              }
              
              if (genreName) {
                if (!genreMap[genreName]) {
                  genreMap[genreName] = []
                }
                genreMap[genreName].push(item)
              }
            })
          }
        })
        
        // Filter and sort genre categories
        const genreCategories: Record<string, (Movie | TVShow)[]> = {}
        Object.entries(genreMap)
          .filter(([_, items]) => items.length >= 1) // Show genres even if they have only 1 item for now
          .sort((a, b) => b[1].length - a[1].length) // Sort genres by number of items descending
          .forEach(([genreName, items]) => {
            // Sort items in each genre by rating
            genreCategories[`${genreName} Agasobanuye`] = items
              .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
              .slice(0, 20)
          })

        // Set category data
        const nextCategoryData: Record<string, (Movie | TVShow)[]> = {
          "Newly Added Agasobanuye Movies": newlyAddedMovies,
          "Newly Added Agasobanuye TV Shows": newlyAddedTVShows,
          "Trending Agasobanuye Movies": trendingMovies,
          "Popular Agasobanuye TV Shows": trendingTVShows,
          ...genreCategories
        }

        setCategoryData(nextCategoryData)

        // Get hero movie (highest rated with backdrop)
        const heroMovie = featuredMovies.find((movie) => movie.backdrop_path) || featuredMovies[0]
        if (heroMovie) {
          setSpotlightItem(heroMovie)
        } else {
          setSpotlightItem(null)
        }

        // Fetch Continue Watching if user is logged in
        if (user) {
          const { data: cwData } = await supabase
            .from("watch_progress_entries")
            .select(`
              *,
              movies (id, title, poster_path, backdrop_path),
              tv_shows (id, name, poster_path, backdrop_path),
              episodes (id, name, still_path, episode_number, season_id, seasons (season_number))
            `)
            .eq("user_id", user.id)
            .eq("is_completed", false)
            .order("last_watched_at", { ascending: false })
            .limit(10)

          if (cwData) {
            const transformed = cwData.map((entry: any) => {
              const isMovie = entry.content_type === 'movie'
              const metadata = isMovie ? entry.movies : entry.tv_shows
              if (!metadata) return null

              return {
                ...metadata,
                id: isMovie ? entry.movie_id : entry.tv_show_id,
                media_type: isMovie ? 'movie' : 'tv',
                cw_progress_percent: entry.progress_percent,
                __progress: {
                  season: entry.episodes?.seasons?.season_number,
                  episode: entry.episodes?.episode_number,
                  watchedDuration: entry.progress_seconds,
                  fullDuration: entry.duration_seconds
                }
              }
            }).filter(Boolean)
            
            setContinueWatchingItems(transformed)
          }
        }

        if (movies.length === 0 && tvShows.length === 0) {
          setError("We couldn't reach the content service. Please check your internet connection or Supabase configuration and reload.")
        }

        setSpotlightLoading(false)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading home data:", err)
        setError(err instanceof Error ? err.message : "Failed to load content")
        setIsLoading(false)
        setSpotlightLoading(false)
      }
    }

    loadData()
  }, [])

  // Get top 10 items from trending categories
  const top10Items = useMemo(() => {
    const trendingMovies = categoryData["Trending Agasobanuye Movies"] || []
    const trendingTV = categoryData["Popular Agasobanuye TV Shows"] || []
    const newlyAddedMovies = categoryData["Newly Added Agasobanuye Movies"] || []
    const newlyAddedTV = categoryData["Newly Added Agasobanuye TV Shows"] || []

    // Combine all relevant items and take top 10
    const allItems = [...trendingMovies, ...trendingTV, ...newlyAddedMovies, ...newlyAddedTV]

    // Remove duplicates based on id
    const uniqueItems = allItems.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
    )

    return uniqueItems.slice(0, 10)
  }, [categoryData])

  if (error) {
    return (
      <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0 text-white">
        <div className="pt-8 md:pt-24 px-6 sm:px-10 pb-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">We couldn't load the browse page</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Reload
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">

      {/* HERO */}
      <SpotlightSection 
        item={spotlightItem} 
        isLoading={spotlightLoading} 
      />
      
      {/* Subscription Notification Banner */}
      <div className="w-full bg-gradient-to-r from-[#004488] via-[#0071eb] to-[#004488] py-4 md:py-6 px-4 sm:px-6 md:px-12 relative overflow-hidden flex items-center justify-center border-y border-white/10 shadow-[0_0_30px_rgba(0,113,235,0.2)] z-20">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 flex-col sm:flex-row">
            <div className="bg-white text-[#0071eb] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
              Coming Soon
            </div>
            <p className="text-white text-sm md:text-lg font-bold tracking-wide">
              The ultimate <span className="text-yellow-300 font-black">ad-free</span> experience is almost here.
            </p>
          </div>
          <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 transition-colors px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap">
            Learn More
          </button>
        </div>
      </div>

      {/* TOP 10 SECTION */}
      <div className="pt-8 md:pt-12 mb-10 overflow-visible">
        <div className="px-4 sm:px-6 md:px-12 mb-6 flex items-center gap-4 md:gap-6">
          <h2
            className="text-6xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0071eb] via-[#0071eb]/90 to-[#0071eb] tracking-tighter leading-none"
            style={{
              WebkitTextStroke: "2px rgba(0, 113, 235, 0.4)",
              textShadow: "0 0 50px rgba(0, 113, 235, 0.2)",
            }}
          >
            TOP 10
          </h2>
          <div className="flex flex-col justify-center pt-2">
            <span className="text-white text-base md:text-2xl font-black tracking-[0.3em] uppercase opacity-90 leading-tight">Content</span>
            <span className="text-white text-base md:text-2xl font-black tracking-[0.3em] uppercase opacity-90 leading-tight">Today</span>
          </div>
        </div>
        <Top10Section items={top10Items} />
      </div>

      <div className="py-4 sm:py-6 md:py-8 space-y-12">
        {/* Continue Watching */}
        {continueWatchingItems.length > 0 && (
          <ContinueWatchingRow items={continueWatchingItems} />
        )}

        {/* TV Show Highlight Card */}
        {allTVShows.length > 0 && (
          <div className="px-2 sm:px-4 md:px-8">
            <TvShowHighlightCard show={allTVShows[0]} />
          </div>
        )}

        <div className="px-2 sm:px-4 md:px-8 space-y-12">
          {/* Portrait categories */}
          {Object.keys(categoryData).map((title, index) => {
            const items = categoryData[title] || []
            if (items.length === 0) return null
            const delay = (continueWatchingItems.length > 0) ? (index + 1) * 160 : index * 160
            return (
              <div key={title} className="animate-stagger" style={{ animationDelay: `${delay}ms` }}>
                <PortraitCategoryRow title={title} items={items} />
              </div>
            )
          })}
        </div>

        {!isLoading && !hasContent(categoryData) && (
          <div className="px-4 md:px-8 py-10 text-center text-white/60">
            No movies or TV shows are available right now.
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
