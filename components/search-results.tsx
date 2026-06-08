"use client"

import type { Movie, TVShow } from "@/lib/types"
import { Star, Play, Search, Plus } from "lucide-react"
import Link from "next/link"
import { getTMDBImageUrl } from "@/lib/tmdb"
import { Button } from "@/components/ui/button"

interface SearchResultsProps {
  movies: Movie[]
  tvShows: TVShow[]
  query: string
  type: "all" | "movies" | "tv-shows"
}

export function SearchResults({ movies, tvShows, query, type }: SearchResultsProps) {
  const allResults = [...movies, ...tvShows]

  if (allResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-xl">
          <Search className="w-10 h-10 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No results found</h2>
        <p className="text-zinc-500 max-w-xs mx-auto mb-8">
          We couldn't find anything matching "{query}". Try different keywords or check your spelling.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="rounded-xl font-bold">
            <Link href="/categories">
              Browse Categories
            </Link>
          </Button>
          <Button asChild className="bg-[#0071eb] hover:bg-[#005bb5] rounded-xl font-bold">
            <Link href={`/request-movie?title=${encodeURIComponent(query)}`}>
              <Plus className="h-4 w-4 mr-2" />
              Request Content
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {allResults.map((item) => {
          const isMovie = "title" in item
          const title = isMovie ? (item as Movie).title : (item as TVShow).name
          const date = isMovie ? (item as Movie).release_date : (item as TVShow).first_air_date
          const year = date ? new Date(date).getFullYear() : "N/A"
          const href = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`

          return (
            <Link 
              key={`${isMovie ? 'movie' : 'tv'}-${item.id}`} 
              href={href}
              className="group cursor-pointer relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl transition-all duration-300 hover:scale-105 hover:z-20"
            >
              <img
                src={getTMDBImageUrl(item.poster_path) || "/placeholder.svg"}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              <div className="absolute top-2 right-2 z-20">
                <div className="bg-[#0071eb] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/20">
                  AG
                </div>
              </div>

              <div className="absolute bottom-2 left-2 z-10 transition-opacity duration-300 group-hover:opacity-0">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold border border-white/5">
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                  {item.vote_average?.toFixed(1)}
                  {item.narrator && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-[#0071eb] text-white font-black rounded-sm text-[8px] uppercase tracking-tighter shadow-sm">
                      {item.narrator}
                    </span>
                  )}
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-4">
                <div className="space-y-2">
                  <p className="text-white text-sm font-black leading-tight line-clamp-2 drop-shadow-lg">
                    {title}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
                          {year}
                        </span>
                        {item.narrator && (
                          <span className="px-1.5 py-0.5 bg-[#0071eb] text-white font-black rounded-sm text-[8px] uppercase tracking-tighter shadow-sm">
                            {item.narrator}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs font-black">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {item.vote_average?.toFixed(1)}
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform hover:bg-[#0071eb] hover:text-white">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
