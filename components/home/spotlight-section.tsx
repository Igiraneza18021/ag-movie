"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Info, Check, Plus, Search } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import Link from "next/link"
import { useWatchlist } from "@/hooks/use-watchlist"

interface SpotlightSectionProps {
  item: Movie | TVShow | null
  isLoading: boolean
  onQuickSearchOpen: () => void
}

// Detect if user is on Mac
const isMac = () => {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent)
}

// Extract YouTube key from trailer URL
function pickYouTubeKey(item: Movie | TVShow | null): string | null {
  if (!item?.trailer_url) return null
  const url = item.trailer_url
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export function SpotlightSection({ item, isLoading, onQuickSearchOpen }: SpotlightSectionProps) {
  const [heroImgLoaded, setHeroImgLoaded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [inView, setInView] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLIFrameElement>(null)
  const startTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()

  const ytKey = item ? pickYouTubeKey(item) : null
  const mt = item && 'title' in item ? 'movie' : 'tv'
  const inWatchlist = item ? isInWatchlist(item.id, mt) : false

  // Auto-hide details after 4 seconds
  useEffect(() => {
    if (!item) return

    let hideTimer: NodeJS.Timeout | null = null

    const startHideTimer = () => {
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        setShowDetails(false)
      }, 4000)
    }

    const handleMouseEnter = () => {
      setShowDetails(true)
      if (hideTimer) clearTimeout(hideTimer)
    }

    const handleMouseMove = () => {
      setShowDetails(true)
      startHideTimer()
    }

    const handleMouseLeave = () => {
      startHideTimer()
    }

    startHideTimer()

    const heroElement = heroRef.current
    if (heroElement) {
      heroElement.addEventListener('mouseenter', handleMouseEnter)
      heroElement.addEventListener('mousemove', handleMouseMove)
      heroElement.addEventListener('mouseleave', handleMouseLeave)
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      if (heroElement) {
        heroElement.removeEventListener('mouseenter', handleMouseEnter)
        heroElement.removeEventListener('mousemove', handleMouseMove)
        heroElement.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [item])

  // Detect in-viewport
  useEffect(() => {
    if (!heroRef.current) return
    const io = new IntersectionObserver(([entry]) => {
      const isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0.6
      setInView(isIntersecting)
      
      if (videoRef.current) {
        if (isIntersecting) {
          videoRef.current.play().catch(console.error)
        } else {
          videoRef.current.pause()
        }
      }
    }, {
      threshold: [0, 0.25, 0.6, 1],
    })
    io.observe(heroRef.current)
    return () => io.disconnect()
  }, [])

  // When image has loaded AND hero visible, start trailer after 3s
  useEffect(() => {
    if (!item || !heroImgLoaded || !inView) return
    const key = pickYouTubeKey(item)
    if (!key) return

    startTimerRef.current = setTimeout(() => {
      setShowVideo(true)
    }, 3000)
    
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
    }
  }, [item, heroImgLoaded, inView])

  // Handle item transitions
  useEffect(() => {
    if (item) {
      setIsTransitioning(true)
      setHeroImgLoaded(false)
      const timer = setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [item])

  useEffect(() => {
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
    }
  }, [])

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleWatchlistToggle = () => {
    if (!item) return
    if (inWatchlist) {
      removeFromWatchlist(item.id, mt)
    } else {
      addToWatchlist({
        id: item.id,
        type: mt,
        title: 'title' in item ? item.title : item.name,
        poster_path: item.poster_path || null,
        vote_average: item.vote_average || 0,
        release_date: 'release_date' in item ? item.release_date : undefined,
        first_air_date: 'first_air_date' in item ? item.first_air_date : undefined,
      })
    }
  }

  if (isLoading || !item) {
    return (
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden flex items-end bg-[#090a0a]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    )
  }

  const bgImage = getTMDBImageUrl(item.backdrop_path || "", "original") || getTMDBImageUrl(item.poster_path || "", "original")
  const title = 'title' in item ? item.title : item.name
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date
  const runtime = 'runtime' in item ? item.runtime : undefined
  const seasons = 'number_of_seasons' in item ? item.number_of_seasons : undefined

  const formatReleaseDate = (date?: string) => {
    if (!date) return ""
    try {
      return new Date(date).getFullYear().toString()
    } catch {
      return ""
    }
  }

  const watchPath = mt === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`
  const infoPath = mt === "tv" ? `/tv/${item.id}` : `/movie/${item.id}`

  return (
    <section
      ref={heroRef}
      id="spotlight"
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden flex items-end"
    >
      {/* Base image */}
      {bgImage && (
        <img
          src={bgImage}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform scale-[1.02] transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setHeroImgLoaded(true)}
          fetchPriority="high"
        />
      )}

      {/* YouTube trailer preview */}
      {showVideo && ytKey && (
        <iframe
          ref={videoRef}
          src={`https://www.youtube.com/embed/${ytKey}?autoplay=1&loop=1&playlist=${ytKey}&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&start=0`}
          className="absolute inset-0 w-full h-full object-cover"
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          frameBorder="0"
          title="Trailer"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/80 via-black/40 md:via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/80 md:from-[#090a0a]/60 via-[#090a0a]/10 to-transparent" />

      {/* Mute Button - Top Right Corner (Desktop Only) */}
      {showVideo && ytKey && (
        <button
          onClick={toggleMute}
          className="hidden md:block absolute top-20 right-4 bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg border border-white/20 backdrop-blur-sm z-30"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      )}

      {/* QuickSearch Bubble - Desktop Only */}
      <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 z-20 animate-fade-in-delayed backdrop-blur-sm">
        <div
          className="bg-white/10 border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg cursor-pointer hover:bg-white/15 transition-all duration-200"
          onClick={onQuickSearchOpen}
        >
          <Search className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">
            Press <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{isMac() ? 'Cmd+G' : 'Ctrl+G'}</kbd> to quickly search movies/tv
          </span>
        </div>
      </div>

      {/* Copy + Actions */}
      <div className={`relative z-10 p-4 md:p-8 pb-0 w-full md:pl-8 md:pr-0 md:text-left text-center transition-all duration-300 ${
        isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}>
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 w-full md:w-[24rem] animate-fade-in-delayed">
          {title}
        </h1>

        <div className="flex items-center gap-1 sm:gap-2 mb-4 animate-fade-in-delayed-2 justify-center md:justify-start flex-wrap">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-2 py-1 rounded font-bold tracking-tight text-xs uppercase shadow-lg">
            Agasobanuye Movies
          </div>
          <span className="text-neutral-300 text-sm sm:text-base font-medium">{item.vote_average?.toFixed(1) || "8.0"}</span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-300 text-sm sm:text-base">
            {formatReleaseDate(releaseDate)}
          </span>
          {runtime && (
            <>
              <span className="text-neutral-400 hidden sm:inline">•</span>
              <span className="text-neutral-300 text-sm sm:text-base hidden sm:inline">
                {`${Math.floor(runtime / 60)}h ${runtime % 60}m`}
              </span>
            </>
          )}
          {seasons && (
            <>
              <span className="text-neutral-400 hidden sm:inline">•</span>
              <span className="text-neutral-300 text-sm sm:text-base hidden sm:inline">
                {`${seasons} seasons`}
              </span>
            </>
          )}
          <span className="text-neutral-400 hidden sm:inline">•</span>
          <span className="text-green-400 text-sm sm:text-base font-semibold hidden sm:inline">98% Match</span>
        </div>

        {/* Details section */}
        <div className={`transition-all duration-500 overflow-hidden ${
          showDetails 
            ? 'opacity-100 max-h-screen' 
            : 'opacity-0 max-h-0'
        }`}>
          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-16 leading-5 sm:leading-6 max-w-xl line-clamp-3 overflow-ellipsis animate-fade-in-delayed-3 mx-auto md:mx-0">
            {item.overview}
          </p>
        </div>

        <div className="flex flex-col md:flex-row mb-4 w-full md:justify-between items-center gap-4 animate-fade-in-delayed-2">
          <div className="flex items-center gap-2 justify-center">
            <Link href={watchPath}>
              <button className="bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base flex items-center gap-2 hover:bg-gray-200 transition-all duration-200 shadow-lg">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
                Play
              </button>
            </Link>
            <Link href={infoPath}>
              <button className="bg-gray-600/70 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold text-sm sm:text-base flex items-center gap-2 hover:bg-gray-600/50 transition-all duration-200 shadow-lg">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                More Info
              </button>
            </Link>
            {showVideo && ytKey && (
              <button
                onClick={toggleMute}
                className="bg-gray-600/70 text-white p-2.5 sm:p-3 rounded-full hover:bg-gray-600/50 transition-all duration-200 shadow-lg border border-gray-500/30"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={handleWatchlistToggle}
              className={`bg-white/15 text-white p-2 sm:p-2.5 rounded-full hover:bg-white/25 transition-all cursor-pointer ${
                inWatchlist ? 'bg-white/20' : ''
              }`}
              aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              {inWatchlist ? (
                <Check className="w-4 h-4 sm:w-6 sm:h-6" />
              ) : (
                <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

