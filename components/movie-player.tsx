"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MovieActionButtons } from "@/components/movie-action-buttons"
import { LoadingSpinner } from "@/components/ui/loading"
import { MobileVideoPlayer } from "@/components/mobile-video-player"
import { getTMDBImageUrl } from "@/lib/tmdb"
import { isMobile } from "@/lib/mobile-utils"
import type { Movie } from "@/lib/types"
import { Play, X, Volume2, VolumeX, ChevronRight, Settings, RotateCcw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface MoviePlayerProps {
  movie: Movie
  nextMovie?: Movie
  onNextMovie?: () => void
  autoPlay?: boolean
}

export function MoviePlayer({ movie, nextMovie, onNextMovie, autoPlay = false }: MoviePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showNextMovie, setShowNextMovie] = useState(false)
  const [autoNextEnabled, setAutoNextEnabled] = useState(false) // Disabled by default
  const [nextMovieTimer, setNextMovieTimer] = useState(10)
  const [videoEnded, setVideoEnded] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [showMobilePlayer, setShowMobilePlayer] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  const backdropUrl = getTMDBImageUrl(movie.backdrop_path || "", "original")
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : ""

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
    setIsMobileDevice(isMobile())
    if (autoPlay) {
      setIsPlaying(true)
    }
  }, [autoPlay])

  const handlePlay = () => {
    if (isMobileDevice) {
      setShowMobilePlayer(true)
    } else {
      setIsPlaying(true)
    }
  }

  const handleClose = () => {
    setIsPlaying(false)
    setVideoEnded(false)
    setShowNextMovie(false)
    if (autoPlay) {
      // If auto-played, go back to details page
      window.history.back()
    }
  }

  // Auto-next functionality - DISABLED
  // useEffect(() => {
  //   if (isPlaying && nextMovie && autoNextEnabled) {
  //     const timer = setInterval(() => {
  //       setNextMovieTimer((prev) => {
  //         if (prev <= 1) {
  //           // Use setTimeout to avoid setState during render
  //           setTimeout(() => {
  //             onNextMovie?.()
  //           }, 0)
  //           return 10
  //         }
  //         return prev - 1
  //       })
  //     }, 1000)

  //     return () => clearInterval(timer)
  //   }
  // }, [isPlaying, nextMovie, autoNextEnabled, onNextMovie])

  // Show next movie after 5 minutes - DISABLED
  // useEffect(() => {
  //   if (isPlaying && nextMovie) {
  //     const timer = setTimeout(() => {
  //       setShowNextMovie(true)
  //     }, 5 * 60 * 1000) // 5 minutes

  //     return () => clearTimeout(timer)
  //   }
  // }, [isPlaying, nextMovie])

  // Handle video end detection - DISABLED
  // useEffect(() => {
  //   if (videoEnded && nextMovie && autoNextEnabled) {
  //     const timer = setInterval(() => {
  //       setNextMovieTimer((prev) => {
  //         if (prev <= 1) {
  //           // Use setTimeout to avoid setState during render
  //           setTimeout(() => {
  //             onNextMovie?.()
  //           }, 0)
  //           return 10
  //         }
  //         return prev - 1
  //       })
  //     }, 1000)

  //     return () => clearInterval(timer)
  //   } else if (videoEnded && nextMovie) {
  //     setShowNextMovie(true)
  //   }
  // }, [videoEnded, nextMovie, autoNextEnabled, onNextMovie])

  // Listen for video end events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'video-ended' || data.event === 'ended') {
            setVideoEnded(true)
          }
        } catch (e) {
          if (event.data.includes('ended') || event.data.includes('complete')) {
            setVideoEnded(true)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleLike = () => {
    console.log("Liked movie:", movie.title)
  }

  if (!mounted) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="text-white" />
          <div className="text-white text-lg animate-fade-in">Loading Movie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {!isPlaying ? (
        // Movie Background with Play Button
        <div className="relative h-screen flex items-center justify-center">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-fade-in"
            style={{
              backgroundImage: `url(${backdropUrl})`,
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content */}
          <div className="relative z-10 text-center px-4">
            <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 animate-hero-text">
              {movie.title}
            </h1>
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap animate-stagger-2">
              {movie.vote_average && (
                <Badge variant="secondary" className="text-sm hover-scale">
                  ★ {movie.vote_average.toFixed(1)}
                </Badge>
              )}
              {releaseYear && (
                <Badge variant="outline" className="text-sm hover-scale">
                  {releaseYear}
                </Badge>
              )}
              {movie.runtime && (
                <Badge variant="outline" className="text-sm hover-scale">
                  {movie.runtime}min
                </Badge>
              )}
            </div>
            <div className="animate-stagger-3">
              <MovieActionButtons 
                movie={movie} 
                onPlay={handlePlay}
                onLike={handleLike}
                isLiked={false}
              />
            </div>
          </div>
        </div>
      ) : (
        // Video Player
        <div className="fixed inset-0 w-full h-full bg-black movie-player-enter">
          {/* Go Back Button - Always visible */}
          <div className="absolute top-4 left-4 z-10">
            <Button variant="secondary" size="sm" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Player Controls */}
          {!autoPlay && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Auto-next Settings - REMOVED */}
          {/* No auto-next functionality */}

          {/* Next Movie Popup - REMOVED */}
          {/* No automatic next movie popup */}

          {/* Video Player */}
          <div className="absolute inset-0 w-full h-full">
            <iframe
              ref={iframeRef}
              src={movie.embed_url}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={movie.title}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                height: '100%'
              }}
              onLoad={() => {
                console.log('Video loaded successfully')
              }}
              onError={(e) => {
                console.error('Video failed to load:', e)
              }}
            />
          </div>
        </div>
      )}
      
      {/* Mobile Video Player */}
      {showMobilePlayer && (
        <MobileVideoPlayer
          src={movie.embed_url}
          title={movie.title}
          poster={backdropUrl}
          onClose={() => setShowMobilePlayer(false)}
        />
      )}
    </div>
  )
}