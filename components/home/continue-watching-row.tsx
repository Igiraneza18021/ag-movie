"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"

interface ContinueWatchingRowProps {
  items: any[]
}

const MAX_CW_VISIBLE = 8

export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  const router = useRouter()
  
  const safeItems = Array.isArray(items) ? items : []
  const showMore = safeItems.length > MAX_CW_VISIBLE
  const visible = useMemo(() => safeItems.slice(0, MAX_CW_VISIBLE), [safeItems])

  const cards = useMemo(
    () =>
      visible.map((it) => {
        const mt = (it.mediaType || it.media_type || (it.title ? "movie" : "tv")).toLowerCase()
        const id = it.id
        const season = mt === "movie" ? 1 : Math.max(1, it.__progress?.season ?? it.season_number ?? it.season ?? 1)
        const episode = mt === "movie" ? 1 : Math.max(1, it.__progress?.episode ?? it.episode_number ?? it.episode ?? 1)
        const path = mt === "tv" ? `/tv/${id}` : `/movie/${id}`

        const full = Number(it.__progress?.fullDuration ?? it.full_duration ?? it.fullDuration ?? 0)
        const watched = Number(it.__progress?.watchedDuration ?? it.watched_duration ?? it.watchedDuration ?? 0)
        const pctRaw =
          typeof it.cw_progress_percent === "number"
            ? Math.max(0, Math.min(100, Math.round(it.cw_progress_percent)))
            : full > 0
              ? Math.min(100, Math.round((watched / full) * 100))
              : 0
        const pct = pctRaw === 0 && full > 0 && watched > 0 ? 1 : pctRaw

        const remainingLabel = (() => {
          if (!full) return "0 left"
          const rem = Math.max(0, full - watched)
          const minutes = Math.round(rem / 60)
          if (minutes >= 60) {
            const h = Math.floor(minutes / 60)
            const m = minutes % 60
            return `${h}h${m}m left`
          }
          return `${minutes}m left`
        })()

        const sub = mt === "movie" ? `Movie • ${remainingLabel}` : `S${season} • E${episode} • ${remainingLabel}`

        return {
          id,
          mt,
          season,
          episode,
          path,
          pct,
          sub,
          img: getTMDBImageUrl(it.backdrop_path || "", "w500") || getTMDBImageUrl(it.poster_path || "", "w500"),
          title: it.title || it.name || "Untitled",
        }
      }),
    [visible],
  )

  if (!cards.length) return null

  return (
    <section className="animate-stagger" style={{ animationDelay: "0ms" }}>
      <div className="px-2 sm:px-4 md:px-8 mb-3 flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">Continue Watching</h2>
        <button
          onClick={() => router.push("/watchlist")}
          className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="px-2 sm:px-4 md:px-8">
        <div 
          className="grid grid-flow-col auto-cols-[75%] sm:auto-cols-[50%] md:auto-cols-[33%] lg:auto-cols-[25%] gap-3 md:gap-4 overflow-x-auto pb-2 hide-scrollbar"
          style={{
            touchAction: 'pan-x pan-y pinch-zoom',
            scrollBehavior: 'smooth'
          }}
        >
          {cards.map((c) => (
            <div
              key={`${c.mt}-${c.id}-${c.season}-${c.episode}`}
              role="button"
              tabIndex={0}
              className="relative group rounded-xl overflow-hidden bg-neutral-900 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              onClick={() => router.push(c.path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  router.push(c.path)
                }
              }}
              aria-label={`Continue ${c.title}`}
            >
              <div
                className="w-full aspect-video bg-cover bg-center"
                style={{ backgroundImage: `url('${c.img || ""}')` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
              <div className="absolute left-3 bottom-10">
                <div className="bg-white/15 backdrop-blur-xs text-white text-sm md:text-base px-3 py-1.5 rounded-full shadow">
                  Continue watching
                </div>
              </div>
              <div className="absolute left-3 bottom-4 text-xs md:text-sm text-white/90">{c.sub}</div>
              <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/10">
                <div className="h-full bg-white/90" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}

          {showMore && (
            <button
              onClick={() => router.push("/watchlist")}
              className="relative rounded-xl overflow-hidden bg-neutral-900/60 border border-white/10 hover:bg-neutral-800/80 transition"
            >
              <div className="w-full aspect-video flex items-center justify-center">
                <div className="text-white/90 text-sm sm:text-base inline-flex items-center gap-2">
                  View more <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

