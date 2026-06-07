"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Movie, TVShow } from "@/lib/types"
import { PosterCard } from "@/components/home/poster-card"
import { WelcomeHero } from "@/components/welcome-hero"
import { Top10Section } from "@/components/home/top10-section"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
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
                  <PosterCard key={movie.id} item={movie} />
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
                  <PosterCard key={show.id} item={show} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Subscription Section relocated to bottom */}
        <section className="relative py-32 bg-black overflow-hidden mt-12">
          <div className="container mx-auto px-6 relative z-20">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071eb]/20 border border-[#0071eb]/30 text-[#0071eb] text-xs font-black uppercase tracking-widest">
                  Premium Experience
                </div>
                <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85]">
                  Go <span className="text-[#0071eb]">Ad-Free</span> <br/>
                  For Ultimate <br className="hidden lg:block" /> immersion
                </h2>
                <p className="text-zinc-400 text-xl md:text-2xl font-bold max-w-2xl leading-relaxed">
                  Subscribe for an uninterrupted, no-ads experience. While we keep ads to a minimum for everyone, Premium members enjoy zero distractions.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                  <Link href="/login">
                    <Button className="h-16 px-12 bg-[#0071eb] hover:bg-[#005bb5] text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_15px_40px_rgba(0,113,235,0.4)] transition-all active:scale-95 text-lg">
                      Subscribe Now
                    </Button>
                  </Link>
                  <div className="flex flex-col">
                    <p className="text-white text-xl font-black uppercase tracking-tight">Starting at $4.99/mo</p>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cancel anytime. No commitments.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-2/5 flex justify-center md:justify-end">
                <div className="relative group">
                  <img 
                    src="/image.png" 
                    alt="Premium" 
                    className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-20 drop-shadow-[0_0_50px_rgba(0,113,235,0.3)] group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
