"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SearchModal } from "@/components/search-modal"
import { FirstVisitRedirect } from "@/components/first-visit-redirect"
import { getMovies, getTVShows } from "@/lib/database-client"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import { SpotlightSection } from "@/components/home/spotlight-section"
import { PortraitCategoryRow } from "@/components/home/portrait-category-row"
import { Top10Section } from "@/components/home/top10-section"
import { ContinueWatchingRow } from "@/components/home/continue-watching-row"
import { ProviderSeriesSection } from "@/components/home/provider-series-section"

// Detect if user is on Mac
const isMac = () => {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent)
}

export default function HomePage() {
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false)
  const [categoryData, setCategoryData] = useState<Record<string, (Movie | TVShow)[]>>({})
  const [spotlightItem, setSpotlightItem] = useState<Movie | TVShow | null>(null)
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [spotlightLoading, setSpotlightLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleQuickSearchOpen = () => setIsQuickSearchOpen(true)

  // Listen for custom event from mobile header search button
  useEffect(() => {
    const handleOpenQuickSearch = () => {
      handleQuickSearchOpen()
    }

    window.addEventListener('openQuickSearch', handleOpenQuickSearch)
    return () => window.removeEventListener('openQuickSearch', handleOpenQuickSearch)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        handleQuickSearchOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load categories and spotlight
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setSpotlightLoading(true)
        setError(null)

        // Fetch movies and TV shows
        const [allMovies, allTVShows] = await Promise.all([
          getMovies(50),
          getTVShows(50),
        ])

        // Process movies for different sections
        const featuredMovies = allMovies.slice(0, 10)
        const trendingMovies = allMovies
          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          .slice(0, 20)
        const topRatedMovies = allMovies
          .filter((movie) => (movie.vote_average || 0) >= 8.0)
          .slice(0, 20)

        // Process TV shows
        const featuredTVShows = allTVShows.slice(0, 10)
        const trendingTVShows = allTVShows
          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          .slice(0, 20)
        const topRatedTVShows = allTVShows
          .filter((show) => (show.vote_average || 0) >= 8.0)
          .slice(0, 20)

        // Set category data
        setCategoryData({
          "Trending Movies": trendingMovies,
          "Top Rated Movies": topRatedMovies,
          "Popular TV Shows": trendingTVShows,
          "Top Rated TV Shows": topRatedTVShows,
        })

        // Get hero movie (highest rated with backdrop)
        const heroMovie = featuredMovies.find((movie) => movie.backdrop_path) || featuredMovies[0]
        if (heroMovie) {
          setSpotlightItem(heroMovie)
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
    const trendingMovies = categoryData["Trending Movies"] || []
    const trendingTV = categoryData["Popular TV Shows"] || []
    const popularMovies = categoryData["Top Rated Movies"] || []
    const popularTV = categoryData["Top Rated TV Shows"] || []

    // Combine all trending/popular items and take top 10
    const allItems = [...trendingMovies, ...trendingTV, ...popularMovies, ...popularTV]

    // Remove duplicates based on id
    const uniqueItems = allItems.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
    )

    return uniqueItems.slice(0, 10)
  }, [categoryData])

  if (error) {
    return (
      <FirstVisitRedirect>
        <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0 text-white">
          <Navigation />
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
      </FirstVisitRedirect>
    )
  }

  return (
    <FirstVisitRedirect>
      <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
        <Navigation />

        {/* HERO */}
        <SpotlightSection 
          item={spotlightItem} 
          isLoading={spotlightLoading} 
          onQuickSearchOpen={handleQuickSearchOpen}
        />

        {/* TOP 10 SECTION */}
        <Top10Section items={top10Items} />

        <div className="px-2 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
          {/* Continue Watching */}
          {continueWatchingItems.length > 0 && (
            <ContinueWatchingRow items={continueWatchingItems} />
          )}

          {/* Provider Series Section */}
          <ProviderSeriesSection />

          {/* Portrait categories */}
          {Object.keys(categoryData).map((title, index) => {
            const items = categoryData[title] || []
            const delay = (continueWatchingItems.length > 0) ? (index + 1) * 160 : index * 160
            return (
              <div key={title} className="animate-stagger" style={{ animationDelay: `${delay}ms` }}>
                <PortraitCategoryRow title={title} items={items} />
              </div>
            )
          })}
        </div>

        <Footer />
        <SearchModal isOpen={isQuickSearchOpen} onClose={() => setIsQuickSearchOpen(false)} />
      </div>
    </FirstVisitRedirect>
  )
}
