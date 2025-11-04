"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WatchlistButton } from "@/components/watchlist-button"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"
import { Play, Mic } from "lucide-react"
import Link from "next/link"

interface PosterCardProps {
  item: Movie | TVShow
}

export function PosterCard({ item }: PosterCardProps) {
  const mt = 'title' in item ? 'movie' : 'tv'
  const href = `/${mt}/${item.id}`
  const posterUrl = getTMDBImageUrl(item.poster_path || "") || "/placeholder.svg?height=288&width=192"
  const title = 'title' in item ? item.title : item.name
  const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : ""

  return (
    <Link href={href} className="flex-none w-36 sm:w-48 group/item cursor-pointer block">
      <div className="relative overflow-hidden rounded-lg bg-card w-full">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-52 sm:h-72 object-cover transition-transform group-hover/item:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex gap-2">
            <Button size="sm" onClick={(e) => e.preventDefault()}>
              <Play className="h-4 w-4" />
            </Button>
            <WatchlistButton
              id={item.id.toString()}
              type={mt}
              title={title}
              poster_path={item.poster_path || ""}
              vote_average={item.vote_average || 0}
              release_date={'release_date' in item ? item.release_date : undefined}
              first_air_date={'first_air_date' in item ? item.first_air_date : undefined}
              variant="outline"
              size="sm"
              showText={false}
            />
          </div>
        </div>

        {/* Rating Badge */}
        {item.vote_average && (
          <Badge className="absolute top-2 right-2 text-xs">★ {item.vote_average.toFixed(1)}</Badge>
        )}

        {/* Narrator Badge */}
        {'narrator' in item && item.narrator && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs max-w-[calc(100%-1rem)]">
            <Mic className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{item.narrator}</span>
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-3 w-full">
        <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2 break-words">{title}</h3>
        <p className="text-xs text-muted-foreground">{year}</p>
      </div>
    </Link>
  )
}
