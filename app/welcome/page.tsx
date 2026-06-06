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

export default function WelcomePage() {
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
        <div className="pt-12 md:pt-20 mb-20 overflow-visible">
          <div className="px-6 md:px-12 mb-8 flex items-center gap-4">
            <h2
              className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0071eb] via-[#0071eb]/80 to-[#0071eb] tracking-tighter"
              style={{
                WebkitTextStroke: "2px rgba(0, 113, 235, 0.4)",
                textShadow: "0 0 40px rgba(0, 113, 235, 0.2)",
              }}
            >
              TOP 10
            </h2>
            <div className="block pt-2 md:pt-4">
              <div className="text-white text-base md:text-lg font-bold tracking-[0.2em] uppercase opacity-90">Content</div>
              <div className="text-white text-base md:text-lg font-bold tracking-[0.2em] uppercase opacity-90">Today</div>
            </div>
          </div>
          <Top10Section items={trendingContent} />
        </div>

        <div className="container mx-auto px-4">
          {/* Featured Movies Section */}
          {featuredMovies.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                  <Film className="h-6 w-6 md:h-8 md:w-8 mr-3 text-[#0071eb]" />
                  Featured Movies
                </h2>
                <Link href="/movies">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 px-4 md:px-8">
                {featuredMovies.slice(0, 6).map((movie) => (
                  <Card key={movie.id} className="group cursor-pointer bg-neutral-900 border-none hover:scale-105 transition-transform duration-300">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3]">
                        <img
                          src={getTMDBImageUrl(movie.poster_path) || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center flex-col gap-3 p-4">
                          <p className="text-white text-sm font-semibold text-center line-clamp-2">{movie.title}</p>
                          <div className="flex gap-2">
                            <Link href={`/movie/${movie.id}`}>
                              <Button size="sm" className="bg-white text-black hover:bg-white/90">
                                <Play className="h-4 w-4 mr-1 fill-current" />
                                Watch
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/60 text-white border-none flex items-center gap-1 backdrop-blur-md">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {movie.vote_average?.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Featured TV Shows Section */}
          {featuredTVShows.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                  <Tv className="h-6 w-6 md:h-8 md:w-8 mr-3 text-[#0071eb]" />
                  Featured TV Shows
                </h2>
                <Link href="/tv-shows">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 px-4 md:px-8">
                {featuredTVShows.slice(0, 6).map((show) => (
                  <Card key={show.id} className="group cursor-pointer bg-neutral-900 border-none hover:scale-105 transition-transform duration-300">
                    <CardContent className="p-0">
                      <div className="relative aspect-[2/3]">
                        <img
                          src={getTMDBImageUrl(show.poster_path) || "/placeholder.svg"}
                          alt={show.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center flex-col gap-3 p-4">
                          <p className="text-white text-sm font-semibold text-center line-clamp-2">{show.name}</p>
                          <div className="flex gap-2">
                            <Link href={`/tv/${show.id}`}>
                              <Button size="sm" className="bg-white text-black hover:bg-white/90">
                                <Play className="h-4 w-4 mr-1 fill-current" />
                                Watch
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/60 text-white border-none flex items-center gap-1 backdrop-blur-md">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {show.vote_average?.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

