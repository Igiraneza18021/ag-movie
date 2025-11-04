"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { WatchlistButton } from "@/components/watchlist-button"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import { Play, ThumbsUp, Plus, Eye, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

interface SpotlightSectionProps {
  item: Movie | TVShow
  mediaType: "movie" | "tv"
  isLoading?: boolean
  onWatchClick?: () => void
  onTrailerClick?: () => void
  showDownloads?: boolean
}

// Extract YouTube key from trailer URL
function pickYouTubeKey(item: Movie | TVShow | null): string | null {
  if (!item?.trailer_url) return null
  const url = item.trailer_url
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

// Format release date
function formatReleaseDate(date?: string): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Check if device is mobile
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function SpotlightSection({
  item,
  mediaType,
  isLoading,
  onWatchClick,
  onTrailerClick,
  showDownloads = false,
}: SpotlightSectionProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const [watched, setWatched] = useState(false)
  const [liked, setLiked] = useState(false)
  const [heroImgLoaded, setHeroImgLoaded] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [inView, setInView] = useState(true)
  const [showDetails, setShowDetails] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const heroRef = useRef<HTMLElement>(null)
  const desktopVideoRef = useRef<HTMLIFrameElement>(null)
  const startTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const ytKey = item ? pickYouTubeKey(item) : null
  const title = mediaType === "movie" ? (item as Movie).title : (item as TVShow).name
  const backdropPath = item?.backdrop_path
  const backgroundImage = backdropPath ? getTMDBImageUrl(backdropPath, "original") : ""
  const releaseDate = mediaType === "movie" ? (item as Movie).release_date : (item as TVShow).first_air_date
  const runtime = mediaType === "movie" ? (item as Movie).runtime : undefined

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileDevice())
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Intersection observer for hero visibility
  useEffect(() => {
    if (!heroRef.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        setInView(isIntersecting)

        if (ytKey && showVideo) {
          if (!isIntersecting) {
            setShowVideo(false)
          }
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
      }
    )
    io.observe(heroRef.current)
    return () => io.disconnect()
  }, [ytKey, showVideo])

  // Scroll listener to stop video when out of view
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current || !ytKey || !showVideo) return

      const heroRect = heroRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const isCompletelyOutOfView = heroRect.top >= windowHeight || heroRect.bottom <= 0

      if (isCompletelyOutOfView) {
        setShowVideo(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [ytKey, showVideo])

  // Start video after 3 seconds when image loaded and in view
  useEffect(() => {
    if (!item || !heroImgLoaded || !inView) return
    if (!ytKey) return

    startTimerRef.current = setTimeout(() => {
      setShowVideo(true)
    }, 3000)
    return () => {
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
    }
  }, [item, heroImgLoaded, inView, ytKey])

  // Stop video when hero goes out of view
  useEffect(() => {
    if (!inView && showVideo) {
      setShowVideo(false)
    }
  }, [inView, showVideo])

  // Auto-hide details after 4 seconds of mouse inactivity
  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null

    const startHideTimer = () => {
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        setShowDetails(false)
      }, 4000)
    }

    const handleMouseEnter = () => {
      setShowDetails(true)
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    const handleMouseMove = () => {
      setShowDetails(true)
      startHideTimer()
    }

    const handleMouseLeave = () => {
      startHideTimer()
    }

    startHideTimer()

    const setupListeners = () => {
      const heroElement = heroRef.current
      if (heroElement) {
        heroElement.addEventListener("mouseenter", handleMouseEnter)
        heroElement.addEventListener("mousemove", handleMouseMove)
        heroElement.addEventListener("mouseleave", handleMouseLeave)
        return true
      }
      return false
    }

    const timeoutId = setTimeout(() => {
      setupListeners()
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (hideTimer) clearTimeout(hideTimer)
      const heroElement = heroRef.current
      if (heroElement) {
        heroElement.removeEventListener("mouseenter", handleMouseEnter)
        heroElement.removeEventListener("mousemove", handleMouseMove)
        heroElement.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [item])

  // Update iframe src when mute state changes (Desktop only)
  useEffect(() => {
    if (ytKey && showVideo && !isMobile && desktopVideoRef.current) {
      const muteValue = isMuted ? 1 : 0
      const newSrc = `https://www.youtube.com/embed/${ytKey}?autoplay=1&loop=1&playlist=${ytKey}&mute=${muteValue}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&start=0`

      if (desktopVideoRef.current.src !== newSrc) {
        desktopVideoRef.current.src = newSrc
      }
    }
  }, [isMuted, ytKey, showVideo, isMobile])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleWatchlistToggle = useCallback(() => {
    if (!item?.id) return
    // TODO: Implement watchlist toggle
    setInWatchlist(!inWatchlist)
  }, [item, inWatchlist])

  const handleLikeClick = useCallback(() => {
    if (!item?.id) return
    setLiked(!liked)
    // TODO: Implement like functionality
  }, [item, liked])

  const handleWatchedClick = useCallback(() => {
    if (!item?.id) return
    setWatched(!watched)
    // TODO: Implement watched functionality
  }, [item, watched])

  const handleDownloadClick = () => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (showDownloads) {
      newParams.delete("dl")
    } else {
      newParams.set("dl", "1")
    }
    router.push(`?${newParams.toString()}`)
  }

  if (isLoading || !item) {
    return (
      <section className="relative w-full h-screen overflow-hidden flex items-end animate-slide-up">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212] to-[#090a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/80 via-black/40 md:via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/80 md:from-[#090a0a]/60 via-[#090a0a]/10 to-transparent" />
      </section>
    )
  }

  return (
    <section
      ref={heroRef}
      id="spotlight"
      className="relative w-full h-screen overflow-hidden flex items-end animate-slide-up"
    >
      {/* Base image */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover will-change-transform scale-[1.02]"
          onLoad={() => setHeroImgLoaded(true)}
          fetchPriority="high"
        />
      )}

      {/* YouTube clip preview - Desktop only */}
      {showVideo && ytKey && !isMobile && (
        <iframe
          ref={desktopVideoRef}
          src={`https://www.youtube.com/embed/${ytKey}?autoplay=1&loop=1&playlist=${ytKey}&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&fs=0&cc_load_policy=0&start=0`}
          className="absolute inset-0 w-full h-full object-cover will-change-transform scale-[1.02]"
          allow="autoplay; encrypted-media"
          allowFullScreen={false}
          frameBorder="0"
          title="Clip"
          onError={() => {
            setShowVideo(false)
          }}
        />
      )}

      {!backgroundImage && <div className="absolute inset-0 bg-gradient-to-b from-[#121212] to-[#090a0a]" />}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0a]/70 via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#090a0a]/80 via-black/40 md:via-black/20 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a0a]/80 md:from-[#090a0a]/60 via-[#090a0a]/10 to-transparent"></div>

      {/* Mute Button - Top Right Corner (Desktop Only) */}
      {showVideo && ytKey && (
        <button
          onClick={toggleMute}
          className="hidden md:block absolute top-20 right-4 bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-200 shadow-lg border border-white/20 backdrop-blur-sm z-30"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      )}

      {/* Content container */}
      <div
        className={`relative z-10 p-6 sm:p-8 md:p-12 w-full md:pr-0 text-center md:text-left transition-all duration-500 ${
          showDetails ? "pb-24 md:pb-8" : "pb-32 sm:pb-20 md:pb-16"
        }`}
        style={{ zIndex: 15 }}
      >
        {/* Title */}
        <h1
          className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white w-full md:w-[28rem] animate-fade-in-delayed transition-all duration-500 ${
            showDetails ? "mb-4 sm:mb-6" : "mb-8 sm:mb-12"
          }`}
        >
          {title}
        </h1>

        {/* Details section - Hidden after mouse inactivity */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            showDetails ? "opacity-100 max-h-screen" : "opacity-0 max-h-0"
          }`}
        >
          {/* Rating and info */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4 animate-fade-in-delayed-2 justify-center md:justify-start flex-wrap">
            <div className="bg-gradient-to-r from-[#E50914] to-[#B20710] text-white px-2 py-1 rounded font-bold tracking-tight text-xs uppercase shadow-lg">
              Agasobanuye
            </div>
            <span className="text-neutral-300 font-medium text-sm sm:text-base">
              {item.vote_average?.toFixed(1) || "8.0"}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-300 text-sm sm:text-base">{formatReleaseDate(releaseDate)}</span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-300 text-sm sm:text-base">
              {runtime
                ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
                : mediaType === "tv"
                  ? `${(item as TVShow).number_of_seasons || 0} seasons`
                  : "0-100 seasons"}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-green-400 font-semibold text-sm sm:text-base">98% Match</span>
          </div>

          {/* Description */}
          <p className="text-white text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-16 leading-5 sm:leading-6 max-w-xl line-clamp-3 overflow-ellipsis animate-fade-in-delayed-3 mx-auto md:mx-0">
            {item.overview}
          </p>

          {/* Genre tags */}
          {Array.isArray(item.genres) && item.genres.length > 0 && (
            <div className="flex gap-2 text-neutral-400 text-xs sm:text-sm mb-3 animate-fade-in-delayed-5 justify-center md:justify-start flex-wrap">
              {item.genres.slice(0, 3).map((genre: any, index) => (
                <span key={genre.id || index} className="flex items-center gap-2">
                  <span className="text-neutral-300">{genre.name}</span>
                  {index < Math.min(item.genres.length - 1, 2) && <span>•</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons - Always visible */}
        <div
          className={`flex flex-col md:flex-row w-full md:justify-between items-center gap-4 md:gap-6 animate-fade-in-delayed-4 transition-all duration-500 ${
            showDetails ? "mb-6" : "mb-8 sm:mb-12"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-center md:justify-start w-full md:w-auto">
            {/* Play Button */}
            {onWatchClick && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onWatchClick()
                }}
                className="bg-white text-black px-3 sm:px-8 md:px-10 py-2 sm:py-4 rounded-lg font-bold text-sm sm:text-lg flex items-center gap-2 sm:gap-3 hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 shadow-lg w-auto justify-center touch-manipulation cursor-pointer relative z-20"
              >
                <Play className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" />
                <span className="hidden sm:inline">Play</span>
              </button>
            )}

            {/* Trailer Button */}
            {ytKey && onTrailerClick && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onTrailerClick()
                }}
                className="bg-[#E50914]/80 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg font-bold text-sm sm:text-lg flex items-center gap-2 sm:gap-3 hover:bg-[#E50914] active:bg-[#E50914]/60 transition-all duration-200 shadow-lg w-auto justify-center touch-manipulation cursor-pointer relative z-20"
              >
                <Play className="w-4 h-4 sm:w-5 sm:w-5" fill="currentColor" />
                <span className="hidden sm:inline">Trailer</span>
              </button>
            )}

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDownloadClick()
              }}
              className="bg-[#E50914]/80 text-white px-3 sm:px-6 py-2 sm:py-4 rounded-lg font-bold text-sm sm:text-lg flex items-center gap-2 sm:gap-3 hover:bg-[#E50914] active:bg-[#E50914]/60 transition-all duration-200 shadow-lg w-auto justify-center touch-manipulation cursor-pointer relative z-20"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{showDownloads ? "Hide Downloads" : "Downloads"}</span>
            </button>

            {/* Watched Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleWatchedClick()
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-lg border backdrop-blur-sm cursor-pointer relative z-20 ${
                watched
                  ? "bg-emerald-600/90 hover:bg-emerald-500/90 border-emerald-400/50 text-white shadow-emerald-500/20"
                  : "bg-white/10 hover:bg-white/20 border-white/20 text-white hover:border-white/30"
              }`}
              title={watched ? "Mark as unwatched" : "Mark as watched"}
            >
              <Eye className="w-4 h-4 flex-shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">{watched ? "Watched" : "Mark Watched"}</span>
            </button>

            {/* Like Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLikeClick()
              }}
              className={`p-2 rounded-lg transition-all duration-200 shadow-lg border backdrop-blur-sm cursor-pointer relative z-20 ${
                liked
                  ? "bg-[#E50914]/80 hover:bg-[#B20710]/80 border-[#E50914]/30 text-white"
                  : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
              }`}
              title={liked ? "Unlike" : "Like"}
            >
              <ThumbsUp className="w-4 h-4" />
            </button>

            {/* Watchlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleWatchlistToggle()
              }}
              className={`p-2 rounded-lg transition-all duration-200 shadow-lg border backdrop-blur-sm cursor-pointer relative z-20 ${
                inWatchlist
                  ? "bg-green-600/80 hover:bg-green-500/80 border-green-500/30 text-white"
                  : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
              }`}
              title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Content Rating */}
          <div className="hidden md:flex items-center gap-2">
            <span className="bg-gray-800/80 text-white px-3 py-2 rounded border border-gray-600/50 font-medium text-sm shadow-lg">
              {mediaType === "movie" ? "PG-13" : "TV-14"}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

