"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bookmark } from "lucide-react"

export default function WatchlistPage() {
  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-8 shadow-2xl">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">My Watchlist</CardTitle>
        <CardDescription className="text-zinc-500 font-medium text-lg">Your saved movies and TV shows for later viewing</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pt-8">
        <div className="bg-white/5 border border-white/5 p-12 rounded-[2rem] text-center border-dashed">
          <div className="w-16 h-16 bg-[#0071eb]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-8 h-8 text-[#0071eb]" />
          </div>
          <p className="text-zinc-400 font-bold text-lg mb-2">Your watchlist is empty</p>
          <p className="text-zinc-500 text-sm">Start browsing and add your favorite content to see them here.</p>
        </div>
      </CardContent>
    </Card>
  )
}
