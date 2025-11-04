"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import { Play, Download, Star, Calendar, Film, Tv, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function WelcomePage() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [featuredTVShows, setFeaturedTVShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchFeaturedContent()
    
    // Mark user as visited when they reach the welcome page
    localStorage.setItem('ag-movies-visited', 'true')
  }, [])

  const fetchFeaturedContent = async () => {
    const supabase = createClient()
    
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        supabase
          .from("movies")
          .select("*")
          .eq("status", "active")
          .or("part_number.is.null,part_number.eq.1") // Only show standalone movies or Part 1
          .order("vote_average", { ascending: false })
          .limit(10),
        supabase
          .from("tv_shows")
          .select("*")
          .eq("status", "active")
          .order("vote_average", { ascending: false })
          .limit(10)
      ])

      setFeaturedMovies(moviesResult.data || [])
      setFeaturedTVShows(tvShowsResult.data || [])
    } catch (error) {
      console.error("Error fetching featured content:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading amazing content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Animated Background Carousels */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Top Movies Carousel - Fast */}
          <div className="absolute top-0 left-0 w-full h-1/4 opacity-15">
            <div className="flex animate-scroll-left-fast">
              {[...featuredMovies, ...featuredMovies, ...featuredMovies].map((movie, index) => (
                <div key={`movie-top-${index}`} className="flex-shrink-0 mx-1">
                  <img
                    src={getTMDBImageUrl(movie.poster_path, "w200") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-20 h-32 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Second Movies Carousel - Slow */}
          <div className="absolute top-1/4 left-0 w-full h-1/4 opacity-10">
            <div className="flex animate-scroll-right-slow">
              {[...featuredMovies, ...featuredMovies, ...featuredMovies].map((movie, index) => (
                <div key={`movie-second-${index}`} className="flex-shrink-0 mx-1">
                  <img
                    src={getTMDBImageUrl(movie.poster_path, "w200") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-24 h-36 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Third Movies Carousel - Normal */}
          <div className="absolute top-1/2 left-0 w-full h-1/4 opacity-12">
            <div className="flex animate-scroll-left">
              {[...featuredMovies, ...featuredMovies, ...featuredMovies].map((movie, index) => (
                <div key={`movie-third-${index}`} className="flex-shrink-0 mx-1">
                  <img
                    src={getTMDBImageUrl(movie.poster_path, "w200") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-28 h-40 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TV Shows Carousel - Fast */}
          <div className="absolute bottom-0 left-0 w-full h-1/4 opacity-15">
            <div className="flex animate-scroll-right-fast">
              {[...featuredTVShows, ...featuredTVShows, ...featuredTVShows].map((show, index) => (
                <div key={`show-${index}`} className="flex-shrink-0 mx-1">
                  <img
                    src={getTMDBImageUrl(show.poster_path, "w200") || "/placeholder.svg"}
                    alt={show.name}
                    className="w-20 h-32 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional TV Shows Carousel - Slow */}
          <div className="absolute bottom-1/4 left-0 w-full h-1/4 opacity-8">
            <div className="flex animate-scroll-left-slow">
              {[...featuredTVShows, ...featuredTVShows, ...featuredTVShows].map((show, index) => (
                <div key={`show-second-${index}`} className="flex-shrink-0 mx-1">
                  <img
                    src={getTMDBImageUrl(show.poster_path, "w200") || "/placeholder.svg"}
                    alt={show.name}
                    className="w-24 h-36 object-cover rounded-lg shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background/20 z-5"></div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/image.png"
              alt="Agasobanuye Movies Logo"
              width={200}
              height={200}
              className="object-contain mb-6"
            />
            <h1 className="text-6xl md:text-8xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AGASOBANUYE MOVIES
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your ultimate destination for streaming movies and TV shows. 
            Discover, watch, and download your favorite content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button size="lg" className="text-lg px-8 py-6">
                <ArrowRight className="h-6 w-6 mr-2" />
                Continue to Site
              </Button>
            </Link>
            <Link href="/movies">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Film className="h-6 w-6 mr-2" />
                Browse Movies
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/tv-shows">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Tv className="h-6 w-6 mr-2" />
                Browse TV Shows
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Content Section */}
      <div className="py-20 px-4">
        <div className="container mx-auto">
          {/* Featured Movies */}
          {featuredMovies.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground flex items-center">
                  <Film className="h-8 w-8 mr-3 text-primary" />
                  Featured Movies
                </h2>
                <Link href="/movies">
                  <Button variant="outline">
                    View All Movies
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {featuredMovies.slice(0, 6).map((movie) => (
                  <Card key={movie.id} className="group cursor-pointer hover:scale-105 transition-transform duration-300">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={getTMDBImageUrl(movie.poster_path) || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <Link href={`/movie/${movie.id}`}>
                              <Button size="sm">
                                <Play className="h-4 w-4 mr-1" />
                                Watch
                              </Button>
                            </Link>
                            {movie.download_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={movie.download_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {movie.vote_average?.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Featured TV Shows */}
          {featuredTVShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground flex items-center">
                  <Tv className="h-8 w-8 mr-3 text-primary" />
                  Featured TV Shows
                </h2>
                <Link href="/tv-shows">
                  <Button variant="outline">
                    View All TV Shows
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {featuredTVShows.slice(0, 6).map((show) => (
                  <Card key={show.id} className="group cursor-pointer hover:scale-105 transition-transform duration-300">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={getTMDBImageUrl(show.poster_path) || "/placeholder.svg"}
                          alt={show.name}
                          className="w-full h-64 object-cover rounded-t-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <Link href={`/tv/${show.id}`}>
                              <Button size="sm">
                                <Play className="h-4 w-4 mr-1" />
                                Watch
                              </Button>
                            </Link>
                            {show.download_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={show.download_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {show.vote_average?.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{show.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
