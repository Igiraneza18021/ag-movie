"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, Star, Bookmark, Heart, Pencil, Clock3, RotateCcw, CheckCircle2 } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"
import Link from "next/link"
import Image from "next/image"
import { WatchlistEntryDialog } from "@/components/watchlist-entry-dialog"
import { useMemo, useState } from "react"
import type { WatchlistEntry } from "@/lib/types"

export default function WatchlistPage() {
  const { watchlist, isLoading, saveWatchlistEntry, deleteWatchlistEntry, clearWatchlist } = useWatchlist()
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const selectedEntry = useMemo(
    () => watchlist.find((entry) => entry.id === selectedEntryId) ?? null,
    [selectedEntryId, watchlist],
  )

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071eb]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">My Watchlist</h2>
          <p className="text-zinc-500 font-bold text-lg">
            {watchlist.length > 0
              ? `${watchlist.length} ${watchlist.length === 1 ? "item" : "items"} saved to watch later`
              : "Keep track of movies and TV shows you want to watch"}
          </p>
        </div>

        {watchlist.length > 0 && (
          <Button
            variant="ghost"
            onClick={clearWatchlist}
            className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-[0.2em] h-12 px-6 rounded-xl border border-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {watchlist.length === 0 ? (
        <div className="bg-white/5 border border-white/5 p-16 rounded-[3rem] text-center border-dashed">
          <div className="w-20 h-20 bg-[#0071eb]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Bookmark className="w-10 h-10 text-[#0071eb]" />
          </div>
          <p className="text-zinc-300 font-black text-2xl uppercase tracking-tight mb-3">Your watchlist is empty</p>
          <p className="text-zinc-500 text-lg font-bold max-w-md mx-auto">Start browsing and add your favorite content to see them here.</p>
          
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link href="/movies">
              <button className="h-14 px-8 bg-[#0071eb] hover:bg-[#005bb5] text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#0071eb]/20">
                Browse Movies
              </button>
            </Link>
            <Link href="/tv-shows">
              <button className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95 border border-white/10">
                Browse TV Shows
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {watchlist.map((entry) => {
            const liveProgress = entry.live_progress
            const isShowProgress = Boolean(liveProgress && "completed_episode_count" in liveProgress)

            return (
            <div key={entry.id} className="group relative">
              <Link href={entry.item_type === "movie" ? `/movie/${entry.media.id}` : `/tv/${entry.media.id}`}>
                <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-[#0071eb]/50">
                  <Image
                    src={
                      entry.media.poster_path
                        ? `https://image.tmdb.org/t/p/w500${entry.media.poster_path}`
                        : "/placeholder.svg"
                    }
                    alt={entry.media.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Rating Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {(entry.media.vote_average ?? 0).toFixed(1)}
                    </div>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-[#0071eb] text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                      {entry.item_type === "movie" ? "Movie" : "TV"}
                    </div>
                  </div>

                  {entry.liked ? (
                    <div className="absolute bottom-3 right-3">
                      <div className="rounded-full bg-red-500/90 p-2 text-white shadow-xl">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </Link>

              <div className="mt-4 space-y-2 px-1">
                <Link href={entry.item_type === "movie" ? `/movie/${entry.media.id}` : `/tv/${entry.media.id}`}>
                  <h3 className="font-black text-white text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#0071eb] transition-colors">
                    {entry.media.title}
                  </h3>
                </Link>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-zinc-300">
                    {entry.watch_status.replaceAll("_", " ")}
                  </Badge>
                  {liveProgress ? (
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-zinc-300">
                      {isShowProgress
                        ? `${liveProgress.completed_episode_count}/${liveProgress.total_episode_count_snapshot} episodes`
                        : `${Math.round(liveProgress.progress_percent ?? 0)}% watched`}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-zinc-300">
                      Progress {entry.progress}
                      {entry.media.type === "tv" && entry.media.number_of_episodes ? `/${entry.media.number_of_episodes}` : ""}
                    </Badge>
                  )}
                  {entry.score != null ? (
                    <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-zinc-300">
                      Score {entry.score}/10
                    </Badge>
                  ) : null}
                  {liveProgress?.is_completed ? (
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] uppercase tracking-wider text-emerald-300">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Completed
                    </Badge>
                  ) : null}
                </div>

                {liveProgress ? (
                  <div className="grid grid-cols-1 gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:grid-cols-2">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3 w-3 text-[#0071eb]" />
                      Started{" "}
                      {liveProgress.started_at
                        ? new Date(liveProgress.started_at).toLocaleDateString()
                        : "Not yet"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="h-3 w-3 text-fuchsia-400" />
                      Rewatches {liveProgress.rewatch_count}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                   <div className="flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <Calendar className="h-3 w-3 mr-1.5 text-[#0071eb]" />
                    {entry.media.release_date || entry.media.first_air_date
                      ? new Date(entry.media.release_date || entry.media.first_air_date!).getFullYear()
                      : "TBA"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEntryId(entry.id)}
                      className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5 hover:bg-white/10"
                      title="Edit watchlist entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => void deleteWatchlistEntry(entry.id)}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg border border-white/5 hover:bg-red-500/10 hover:border-red-500/20"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {selectedEntry ? (
        <WatchlistEntryDialog
          item={selectedEntry.media}
          entry={selectedEntry}
          open={Boolean(selectedEntry)}
          onOpenChange={(open) => {
            if (!open) setSelectedEntryId(null)
          }}
          onSave={saveWatchlistEntry}
          onDelete={deleteWatchlistEntry}
        />
      ) : null}
    </div>
  )
}
