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
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Intercept iframe fullscreen and make container fullscreen instead
  useEffect(() => {
    if (!iframeRef.current || !containerRef.current) return

    const iframe = iframeRef.current
    const container = containerRef.current

    // Function to enter fullscreen on container
    const enterFullscreen = async () => {
      try {
        // Use the most modern API first
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen((Element as any).ALLOW_KEYBOARD_INPUT)
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen()
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error)
      }
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = async () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      // If iframe is in fullscreen, exit it and make container fullscreen instead
      if (fullscreenElement === iframe) {
        // Exit iframe fullscreen immediately
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {})
        } else if ((document as any).webkitExitFullscreen) {
          ;(document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          ;(document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          ;(document as any).msExitFullscreen()
        }

        // Immediately make container fullscreen
        setTimeout(() => {
          enterFullscreen()
        }, 50)
      }
    }

    // Also listen for clicks on iframe that might trigger fullscreen
    const handleIframeClick = () => {
      setTimeout(() => {
        const fullscreenElement = 
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement

        if (fullscreenElement === iframe) {
          handleFullscreenChange()
        }
      }, 100)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    // Monitor for iframe fullscreen attempts
    const observer = new MutationObserver(() => {
      handleIframeClick()
    })
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    })

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      observer.disconnect()
    }
  }, [])

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
        <div ref={containerRef} className="fixed inset-0 w-full h-full bg-black movie-player-enter">
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