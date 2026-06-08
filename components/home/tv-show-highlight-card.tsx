"use client"

import { Play, Info } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { TVShow } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface TvShowHighlightCardProps {
  show: TVShow
}

export function TvShowHighlightCard({ show }: TvShowHighlightCardProps) {
  const bgImage = getTMDBImageUrl(show.backdrop_path || "", "original") || getTMDBImageUrl(show.poster_path || "", "original")
  
  return (
    <div className="relative w-full aspect-[4/5] sm:aspect-video md:aspect-[25/9] rounded-[2rem] overflow-hidden group border border-white/10 shadow-2xl">
      {/* Background Image */}
      {bgImage && (
        <img
          src={bgImage}
          alt={show.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 md:hidden" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 hidden md:block" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-end md:justify-center px-6 sm:px-8 md:px-16 pb-8 md:pb-0 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0071eb]/20 border border-[#0071eb]/30 text-[#0071eb] text-[10px] font-black uppercase tracking-widest mb-4 w-fit">
          Newly Added Series
        </div>

        {show.narrator && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Narrated by:</span>
            <span className="px-3 py-1 bg-[#0071eb] text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(0,113,235,0.4)] border border-white/10">
              {show.narrator}
            </span>
          </div>
        )}
        
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-lg">
          {show.name}
        </h2>
        
        <p className="text-zinc-300 text-sm md:text-lg font-medium line-clamp-2 mb-8 max-w-lg drop-shadow">
          {show.overview}
        </p>

        <div className="flex items-center gap-4">
          <Link href={`/tv/${show.id}`}>
            <Button className="bg-white text-black hover:bg-[#0071eb] hover:text-white font-black uppercase tracking-wide rounded-xl h-12 px-8 transition-all active:scale-95 flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              Watch Now
            </Button>
          </Link>
          <Link href={`/tv/${show.id}`}>
            <Button variant="outline" className="bg-white/10 border-white/10 text-white hover:bg-white/20 font-black uppercase tracking-wide rounded-xl h-12 px-8 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Details
            </Button>
          </Link>
        </div>
      </div>

      {/* AG Badge */}
      <div className="absolute top-6 right-8 z-20">
        <div className="bg-[#0071eb] text-white text-xs font-black px-3 py-1 rounded-lg shadow-2xl border border-white/20">
          AG EXCLUSIVE
        </div>
      </div>
    </div>
  )
}
