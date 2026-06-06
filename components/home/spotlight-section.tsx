"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Info, Check, Plus } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import Link from "next/link"
import { useWatchlist } from "@/hooks/use-watchlist"

interface SpotlightSectionProps {
  item: Movie | TVShow | null
  isLoading: boolean
}

// Extract YouTube key from trailer URL
function pickYouTubeKey(item: Movie | TVShow | null): string | null {
  if (!item?.trailer_url) return null
  const url = item.trailer_url
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export function SpotlightSection({ item, isLoading }: SpotlightSectionProps) {
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
          // Playback is handled by autoplay in iframe src
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

  if (isLoading) {
    return (
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden flex items-end bg-[#090a0a]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] overflow-hidden flex items-end bg-[#090a0a]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212] to-[#090a0a]" />
        <div className="relative z-10 w-full px-6 sm:px-8 md:px-12 pb-16 sm:pb-20 md:pb-24 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Ag Movies
          </h1>
          <p className="text-white/70 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0 mb-6">
            We couldn't load featured content right now. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-black px-6 py-3 rounded-lg font-bold text-sm sm:text-base hover:bg-gray-200 transition-all duration-200"
          >
            Reload
          </button>
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
      className="relative w-full h-[70vh] sm:h-[80vh] md:h-[90vh] overflow-hidden flex items-end"
    >
      {/* Base image */}
      {bgImage && (
        <img
          src={bgImage}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
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

      {/* Enhanced Gradients for Natural Fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a] via-[#090a0a]/20 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a] via-[#090a0a]/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/40 via-transparent to-transparent z-10" />
      
      {/* Extra deep fade at the very bottom to ensure perfect transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#090a0a] to-transparent z-20" />

      {/* Mute Button - Top Right Corner (Desktop Only) */}
      {showVideo && ytKey && (
        <button
          onClick={toggleMute}
          className="hidden md:block absolute top-32 right-8 bg-black/20 text-white p-3 rounded-full hover:bg-black/40 transition-all duration-200 shadow-lg border border-white/10 backdrop-blur-md z-30"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      )}

      {/* Copy + Actions */}
      <div className={`relative z-30 p-6 md:p-12 pb-12 w-full md:text-left text-center transition-all duration-700 ${
        isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
      }`}>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 w-full md:max-w-3xl leading-none tracking-tighter drop-shadow-2xl">
          {title}
        </h1>

        <div className="flex items-center gap-2 mb-6 justify-center md:justify-start flex-wrap">
          <div className="bg-[#0071eb] text-white px-3 py-1 rounded-md font-black tracking-tight text-xs uppercase shadow-[0_0_15px_rgba(0,113,235,0.5)]">
            Agasobanuye Exclusive
          </div>
          <span className="text-white text-sm sm:text-base font-black flex items-center gap-1">
            <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            {item.vote_average?.toFixed(1) || "8.0"}
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-white text-sm sm:text-base font-bold">
            {formatReleaseDate(releaseDate)}
          </span>
          {runtime && (
            <>
              <span className="text-neutral-500 hidden sm:inline">•</span>
              <span className="text-white text-sm sm:text-base font-bold hidden sm:inline">
                {`${Math.floor(runtime / 60)}h ${runtime % 60}m`}
              </span>
            </>
          )}
          {seasons && (
            <>
              <span className="text-neutral-500 hidden sm:inline">•</span>
              <span className="text-white text-sm sm:text-base font-bold hidden sm:inline">
                {`${seasons} seasons`}
              </span>
            </>
          )}
        </div>

        {/* Details section */}
        <div className={`transition-all duration-700 overflow-hidden ${
          showDetails 
            ? 'opacity-100 max-h-screen mb-8' 
            : 'opacity-0 max-h-0 mb-0'
        }`}>
          <p className="text-white/80 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl line-clamp-3 overflow-ellipsis mx-auto md:mx-0 drop-shadow-lg">
            {item.overview}
          </p>
        </div>

        <div className="flex flex-col md:flex-row w-full md:justify-between items-center gap-6">
          <div className="flex items-center gap-3 justify-center">
            <Link href={watchPath}>
              <button className="bg-white text-black px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base flex items-center gap-3 hover:bg-[#0071eb] hover:text-white transition-all duration-300 shadow-2xl active:scale-95">
                <Play className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" />
                PLAY NOW
              </button>
            </Link>
            <Link href={infoPath}>
              <button className="bg-white/10 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base flex items-center gap-3 hover:bg-white/20 transition-all duration-300 shadow-2xl backdrop-blur-md border border-white/10">
                <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                DETAILS
              </button>
            </Link>
            
            <button
              onClick={handleWatchlistToggle}
              className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl transition-all cursor-pointer shadow-2xl backdrop-blur-md border border-white/10 ${
                inWatchlist ? 'bg-[#0071eb]/20 text-[#0071eb] border-[#0071eb]/30' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              {inWatchlist ? (
                <Check className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
