"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PlayCircle, Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ContinueWatchingPage() {
  const [progress, setProgress] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setProgress([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("watch_progress_entries")
        .select(`
          *,
          movies (id, title, poster_path, backdrop_path),
          tv_shows (id, name, poster_path, backdrop_path),
          episodes (id, name, still_path, episode_number, season_id, seasons (season_number))
        `)
        .eq("user_id", user.id)
        .eq("is_completed", false)
        .order("last_watched_at", { ascending: false })
        .limit(20)

      if (!error && data) {
        setProgress(data)
      }
      setIsLoading(false)
    }

    fetchProgress()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0071eb]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">Continue Watching</h2>
        <p className="text-zinc-500 font-bold text-lg">Pick up where you left off</p>
      </div>

      {progress.length === 0 ? (
        <div className="bg-white/5 border border-white/5 p-16 rounded-[3rem] text-center border-dashed">
          <div className="w-20 h-20 bg-[#0071eb]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <PlayCircle className="w-10 h-10 text-[#0071eb]" />
          </div>
          <p className="text-zinc-300 font-black text-2xl uppercase tracking-tight mb-3">No history found</p>
          <p className="text-zinc-500 text-lg font-bold max-w-md mx-auto">Your watch progress will appear here once you start streaming.</p>
          
          <Link href="/browse" className="inline-block mt-10">
            <button className="h-14 px-10 bg-[#0071eb] hover:bg-[#005bb5] text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#0071eb]/20">
              Start Watching
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {progress.map((entry) => {
            const isMovie = entry.content_type === 'movie'
            const item = isMovie ? entry.movies : entry.tv_shows
            const title = isMovie ? entry.movies?.title : entry.tv_shows?.name
            const imagePath = isMovie ? entry.movies?.backdrop_path : entry.tv_shows?.backdrop_path
            const watchUrl = isMovie 
              ? `/watch/movie/${entry.movie_id}` 
              : `/watch/tv/${entry.tv_show_id}?season=${entry.episodes?.seasons?.season_number ?? 1}&episode=${entry.episodes?.episode_number ?? 1}`

            return (
              <div key={entry.id} className="group relative">
                <Link href={watchUrl}>
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-[#0071eb]/50">
                    <Image
                      src={
                        imagePath
                          ? `https://image.tmdb.org/t/p/w500${imagePath}`
                          : "/placeholder.jpg"
                      }
                      alt={title || "Content"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                    
                    {/* Progress Bar Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                      <div 
                        className="h-full bg-[#0071eb] shadow-[0_0_10px_#0071eb]" 
                        style={{ width: `${entry.progress_percent || 0}%` }}
                      />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-[#0071eb] rounded-full flex items-center justify-center shadow-2xl">
                        <PlayCircle className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="mt-4 space-y-2 px-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-white text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#0071eb] transition-colors flex-1">
                      {title}
                    </h3>
                    {!isMovie && entry.episodes && (
                       <span className="text-[10px] font-black text-[#0071eb] uppercase tracking-widest ml-2">
                         S{entry.episodes.seasons?.season_number} E{entry.episodes.episode_number}
                       </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    <Clock className="h-3 w-3 mr-1.5 text-[#0071eb]" />
                    {Math.round(entry.progress_percent || 0)}% Completed
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
