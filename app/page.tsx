"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Movie, TVShow } from "@/lib/types"
import { WelcomeHero } from "@/components/welcome-hero"
import { Top10Section } from "@/components/home/top10-section"
import { Film, Tv, ArrowRight, Play, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTMDBImageUrl } from "@/lib/tmdb"
import Link from "next/link"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [featuredTVShows, setFeaturedTVShows] = useState<TVShow[]>([])
  const [trendingContent, setTrendingContent] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchContent()
    
    // Mark user as visited when they reach the welcome page
    localStorage.setItem('ag-movies-visited', 'true')
  }, [])

  const fetchContent = async () => {
    const supabase = createClient()
    
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        supabase
          .from("movies")
          .select("*")
          .eq("status", "active")
          .or("part_number.is.null,part_number.eq.1")
          .order("vote_average", { ascending: false })
          .limit(20),
        supabase
          .from("tv_shows")
          .select("*")
          .eq("status", "active")
          .order("vote_average", { ascending: false })
          .limit(20)
      ])

      const movies = moviesResult.data || []
      const tvShows = tvShowsResult.data || []
      
      setFeaturedMovies(movies)
      setFeaturedTVShows(tvShows)
      
      // Mix movies and TV shows for trending
      const mixed = [...movies.slice(0, 5), ...tvShows.slice(0, 5)].sort((a, b) => 
        (b.vote_average || 0) - (a.vote_average || 0)
      )
      setTrendingContent(mixed)

    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading amazing content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <WelcomeHero movies={featuredMovies} />

      <main className="relative z-10 pb-20">
        {/* Trending Now Section - Increased top padding to avoid clipping by hero separator */}
        <div className="pt-24 md:pt-32 mb-20 overflow-visible">
          <div className="px-6 md:px-12 mb-10 flex items-center gap-6">
            <h2
              className="text-6xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0071eb] via-[#0071eb]/90 to-[#0071eb] tracking-tighter leading-none"
              style={{
                WebkitTextStroke: "2px rgba(0, 113, 235, 0.4)",
                textShadow: "0 0 50px rgba(0, 113, 235, 0.3)",
              }}
            >
              TOP 10
            </h2>
            <div className="flex flex-col justify-center pt-2">
              <span className="text-white text-lg md:text-2xl font-black tracking-[0.3em] uppercase opacity-90 leading-tight">Content</span>
              <span className="text-white text-lg md:text-2xl font-black tracking-[0.3em] uppercase opacity-90 leading-tight">Today</span>
            </div>
          </div>
          <Top10Section items={trendingContent} />
        </div>

        <div className="container mx-auto px-4">
          {/* Featured Movies Section */}
          {featuredMovies.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 md:h-10 bg-[#0071eb] rounded-full shadow-[0_0_15px_rgba(0,113,235,0.5)]" />
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    Featured Agasobanuye Movies
                  </h2>
                </div>
                <Link href="/movies">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 px-4 md:px-8">
                {featuredMovies.slice(0, 6).map((movie) => (
                  <div key={movie.id} className="group cursor-pointer relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl transition-all duration-300 hover:scale-105 hover:z-20">
                    <img
                      src={getTMDBImageUrl(movie.poster_path) || "/placeholder.svg"}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Always visible: AG Badge top right */}
                    <div className="absolute top-2 right-2 z-20">
                      <div className="bg-[#0071eb] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/20">
                        AG
                      </div>
                    </div>

                    {/* Default visible: Rating bottom left */}
                    <div className="absolute bottom-2 left-2 z-10 transition-opacity duration-300 group-hover:opacity-0">
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-bold">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {movie.vote_average?.toFixed(1)}
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                      <div className="space-y-2">
                        <p className="text-white text-sm font-black leading-tight line-clamp-2 drop-shadow-lg">
                          {movie.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                            </span>
                            <div className="flex items-center gap-1 text-white text-xs font-black">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {movie.vote_average?.toFixed(1)}
                            </div>
                          </div>
                          <Link href={`/movie/${movie.id}`}>
                            <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform hover:bg-[#0071eb] hover:text-white transition-colors duration-200">
                              <Play className="h-4 w-4 fill-current" />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured TV Shows Section */}
          {featuredTVShows.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 md:h-10 bg-[#0071eb] rounded-full shadow-[0_0_15px_rgba(0,113,235,0.5)]" />
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    Featured Agasobanuye TV Shows
                  </h2>
                </div>
                <Link href="/tv-shows">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 px-4 md:px-8">
                {featuredTVShows.slice(0, 6).map((show) => (
                  <div key={show.id} className="group cursor-pointer relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl transition-all duration-300 hover:scale-105 hover:z-20">
                    <img
                      src={getTMDBImageUrl(show.poster_path) || "/placeholder.svg"}
                      alt={show.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Always visible: AG Badge top right */}
                    <div className="absolute top-2 right-2 z-20">
                      <div className="bg-[#0071eb] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/20">
                        AG
                      </div>
                    </div>

                    {/* Default visible: Rating bottom left */}
                    <div className="absolute bottom-2 left-2 z-10 transition-opacity duration-300 group-hover:opacity-0">
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-bold">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {show.vote_average?.toFixed(1)}
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                      <div className="space-y-2">
                        <p className="text-white text-sm font-black leading-tight line-clamp-2 drop-shadow-lg">
                          {show.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                              {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}
                            </span>
                            <div className="flex items-center gap-1 text-white text-xs font-black">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {show.vote_average?.toFixed(1)}
                            </div>
                          </div>
                          <Link href={`/tv/${show.id}`}>
                            <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform hover:bg-[#0071eb] hover:text-white transition-colors duration-200">
                              <Play className="h-4 w-4 fill-current" />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

