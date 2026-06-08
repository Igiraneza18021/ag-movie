"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WatchlistEntryDialog } from "@/components/watchlist-entry-dialog"
import { useWatchlist } from "@/hooks/use-watchlist"
import type { WatchlistFilter } from "@/lib/types"
import { Trash2, Calendar, Star, Bookmark, Heart, Pencil, Clock3, RotateCcw, CheckCircle2 } from "lucide-react"

const FILTERS: Array<{ value: WatchlistFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "watching", label: "Watching" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "re_watching", label: "Re-Watching" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
]

export default function WatchlistPage() {
  const { watchlist, isLoading, saveWatchlistEntry, deleteWatchlistEntry, clearWatchlist } = useWatchlist()
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<WatchlistFilter>("all")

  const selectedEntry = useMemo(
    () => watchlist.find((entry) => entry.id === selectedEntryId) ?? null,
    [selectedEntryId, watchlist],
  )

  const filteredWatchlist = useMemo(
    () => (activeFilter === "all" ? watchlist : watchlist.filter((entry) => entry.watch_status === activeFilter)),
    [activeFilter, watchlist],
  )

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071eb]" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight text-white md:text-5xl">My Watchlist</h2>
          <p className="text-lg font-bold text-zinc-500">
            {filteredWatchlist.length > 0
              ? `${filteredWatchlist.length} ${filteredWatchlist.length === 1 ? "item" : "items"} in ${activeFilter === "all" ? "your watchlist" : activeFilter.replaceAll("_", " ")}`
              : "Keep track of movies and TV shows you want to watch"}
          </p>
        </div>

        {watchlist.length > 0 ? (
          <Button
            variant="ghost"
            onClick={clearWatchlist}
            className="h-12 rounded-xl border border-red-500/10 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:bg-red-500/10 hover:text-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        ) : null}
      </div>

      {watchlist.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={
                activeFilter === filter.value
                  ? "rounded-full border border-[#0071eb]/40 bg-[#0071eb] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0071eb]/20"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:bg-white/10"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {filteredWatchlist.length === 0 ? (
        <div className="rounded-[3rem] border border-white/5 border-dashed bg-white/5 p-16 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#0071eb]/10 shadow-2xl">
            <Bookmark className="h-10 w-10 text-[#0071eb]" />
          </div>
          <p className="mb-3 text-2xl font-black uppercase tracking-tight text-zinc-300">
            {watchlist.length === 0 ? "Your watchlist is empty" : "No items match this filter"}
          </p>
          <p className="mx-auto max-w-md text-lg font-bold text-zinc-500">
            {watchlist.length === 0
              ? "Start browsing and add your favorite content to see them here."
              : "Try another filter or keep watching to move items into a different status."}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/movies">
              <button className="h-14 rounded-2xl bg-[#0071eb] px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#0071eb]/20 transition-all hover:bg-[#005bb5] active:scale-95">
                Browse Movies
              </button>
            </Link>
            <Link href="/tv-shows">
              <button className="h-14 rounded-2xl border border-white/10 bg-white/5 px-8 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 active:scale-95">
                Browse TV Shows
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filteredWatchlist.map((entry) => {
            const liveProgress = entry.live_progress
            const isShowProgress = Boolean(liveProgress && "completed_episode_count" in liveProgress)

            return (
              <div key={entry.id} className="group relative">
                <Link href={entry.item_type === "movie" ? `/movie/${entry.media.id}` : `/tv/${entry.media.id}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-[#0071eb]/50">
                    <Image
                      src={entry.media.poster_path ? `https://image.tmdb.org/t/p/w500${entry.media.poster_path}` : "/placeholder.svg"}
                      alt={entry.media.title}
                      fill
                      className="object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />

                    <div className="absolute top-3 left-3">
                      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        {(entry.media.vote_average ?? 0).toFixed(1)}
                      </div>
                    </div>

                    <div className="absolute top-3 right-3">
                      <div className="rounded-lg bg-[#0071eb] px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white">
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
                    <h3 className="line-clamp-1 text-sm font-black uppercase tracking-tight text-white transition-colors group-hover:text-[#0071eb]">
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
                        Started {liveProgress.started_at ? new Date(liveProgress.started_at).toLocaleDateString() : "Not yet"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="h-3 w-3 text-fuchsia-400" />
                        Rewatches {liveProgress.rewatch_count}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <Calendar className="mr-1.5 h-3 w-3 text-[#0071eb]" />
                      {entry.media.release_date || entry.media.first_air_date
                        ? new Date(entry.media.release_date || entry.media.first_air_date!).getFullYear()
                        : "TBA"}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEntryId(entry.id)}
                        className="rounded-lg border border-white/5 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        title="Edit watchlist entry"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void deleteWatchlistEntry(entry.id)}
                        className="rounded-lg border border-white/5 bg-white/5 p-2 text-zinc-600 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
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
