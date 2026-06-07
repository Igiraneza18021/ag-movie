"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MovieRoomCreator } from "@/components/movie-room-creator"
import { MovieRoomJoiner } from "@/components/movie-room-joiner"
import { WatchlistEntryDialog } from "@/components/watchlist-entry-dialog"
import { useWatchlist } from "@/hooks/use-watchlist"
import type { Movie } from "@/lib/types"
import { Play, Download, ExternalLink, MoreVertical, Users, Share2, Heart, Bookmark } from "lucide-react"

interface MovieActionButtonsProps {
  movie: Movie
  onPlay: () => void
  onLike?: () => void
  isLiked?: boolean
}

export function MovieActionButtons({ movie, onPlay, onLike, isLiked = false }: MovieActionButtonsProps) {
  const [isLikedState, setIsLikedState] = useState(isLiked)
  const [isWatchlistDialogOpen, setIsWatchlistDialogOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, promptLogin, getEntryByItem, isInWatchlist, saveWatchlistEntry, deleteWatchlistEntry } = useWatchlist()

  const handleLike = () => {
    setIsLikedState(!isLikedState)
    onLike?.()
  }

  const existingEntry = getEntryByItem(movie.id, "movie")
  const inWatchlist = isInWatchlist(movie.id, "movie")

  const openWatchlistDialog = () => {
    if (!isAuthenticated) {
      promptLogin(pathname)
      return
    }

    setIsWatchlistDialogOpen(true)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.overview,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Primary Actions - Always Visible */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
        <Button 
          size="lg" 
          onClick={onPlay} 
          className="text-lg sm:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 hover-lift animate-play-button bg-primary hover:bg-primary/90 w-full sm:w-auto btn-primary-animated"
        >
          <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
          Play Movie
        </Button>
        
        {movie.download_url && (
          <Button 
            size="lg" 
            variant="outline" 
            asChild 
            className="text-lg sm:text-xl px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 hover-lift w-full sm:w-auto"
          >
            <a href={movie.download_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
              Download
            </a>
          </Button>
        )}

        {/* Secondary Actions - Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg sm:text-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 hover-lift w-full sm:w-auto"
            >
              <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {/* Watchlist */}
            <DropdownMenuItem onSelect={(event) => {
              event.preventDefault()
              openWatchlistDialog()
            }} className="cursor-pointer">
              <Bookmark className="h-4 w-4 mr-2" />
              {inWatchlist ? "Edit Watchlist" : "Add to List"}
            </DropdownMenuItem>

            {/* Like */}
            <DropdownMenuItem onClick={handleLike} className="cursor-pointer">
              <Heart className={`h-4 w-4 mr-2 ${isLikedState ? "fill-current text-red-500" : ""}`} />
              {isLikedState ? "Liked" : "Like"}
            </DropdownMenuItem>

            {/* Share */}
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>

            {/* Watch Trailer */}
            {movie.trailer_url && (
              <DropdownMenuItem asChild>
                <a 
                  href={movie.trailer_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center w-full cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Trailer
                </a>
              </DropdownMenuItem>
            )}

            {/* Watch Party Actions */}
            <DropdownMenuItem asChild>
              <div className="w-full">
                <MovieRoomCreator movie={movie} />
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <div className="w-full">
                <MovieRoomJoiner />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <WatchlistEntryDialog
        item={{
          id: movie.id,
          type: "movie",
          title: movie.title,
          poster_path: movie.poster_path || null,
          vote_average: movie.vote_average || 0,
          release_date: movie.release_date ?? null,
        }}
        entry={existingEntry}
        open={isWatchlistDialogOpen}
        onOpenChange={setIsWatchlistDialogOpen}
        onSave={saveWatchlistEntry}
        onDelete={existingEntry?.id ? deleteWatchlistEntry : undefined}
      />
    </div>
  )
}
