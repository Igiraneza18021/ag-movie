"use client"

import { Star, Play } from "lucide-react"
import Link from "next/link"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"

interface PosterCardProps {
  item: Movie | TVShow
}

export function PosterCard({ item }: PosterCardProps) {
  const isMovie = "title" in item
  const title = isMovie ? (item as Movie).title : (item as TVShow).name
  const date = isMovie ? (item as Movie).release_date : (item as TVShow).first_air_date
  const year = date ? new Date(date).getFullYear() : "N/A"
  const href = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`

  return (
    <Link 
      href={href}
      className="group/poster block cursor-pointer relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:z-20 w-full"
    >
      <img
        src={getTMDBImageUrl(item.poster_path || "") || "/placeholder.svg"}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-110"
      />
      
      {/* Always visible: AG Badge top right */}
      <div className="absolute top-2 right-2 z-20">
        <div className="bg-[#0071eb] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/20">
          AG
        </div>
      </div>

      {/* Default visible: Rating bottom left */}
      <div className="absolute bottom-2 left-2 z-10 transition-opacity duration-300 group-hover/poster:opacity-0">
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-bold border border-white/5">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {item.vote_average?.toFixed(1) || "0.0"}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
        <div className="space-y-2 text-left">
          <p className="text-white text-sm font-black leading-tight line-clamp-2 drop-shadow-lg">
            {title}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                {year}
              </span>
              <div className="flex items-center gap-1 text-white text-xs font-black">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.vote_average?.toFixed(1) || "0.0"}
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover/poster:scale-100 transition-transform hover:bg-[#0071eb] hover:text-white">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
