"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bookmark } from "lucide-react"

export default function WatchlistPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">My Watchlist</h2>
        <p className="text-zinc-500 font-bold text-lg">Your saved movies and TV shows for later viewing</p>
      </div>

      <div className="bg-white/5 border border-white/5 p-16 rounded-[3rem] text-center border-dashed">
        <div className="w-20 h-20 bg-[#0071eb]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <Bookmark className="w-10 h-10 text-[#0071eb]" />
        </div>
        <p className="text-zinc-300 font-black text-2xl uppercase tracking-tight mb-3">Your watchlist is empty</p>
        <p className="text-zinc-500 text-lg font-bold max-w-md mx-auto">Start browsing and add your favorite content to see them here.</p>
        
        <Link href="/browse" className="inline-block mt-10">
          <button className="h-14 px-10 bg-[#0071eb] hover:bg-[#005bb5] text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#0071eb]/20">
            Browse Catalog
          </button>
        </Link>
      </div>
    </div>
  )
}
