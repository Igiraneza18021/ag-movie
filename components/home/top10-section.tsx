"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"

interface Top10SectionProps {
  items: (Movie | TVShow)[]
}

export function Top10Section({ items }: Top10SectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => {
      setCanLeft(el.scrollLeft > 10)
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
    }
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(onScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
    }
  }, [])

  const scrollBy = (dir = 1) => {
    const el = scrollerRef.current
    if (!el) return
    const cardW = el.firstElementChild?.getBoundingClientRect()?.width || 160
    el.scrollBy({ left: dir * cardW * 1.2, behavior: "smooth" })
  }

  if (!items || items.length === 0) return null

  const top10Items = items.slice(0, 10)

  return (
    <section className="relative py-4 md:py-8 overflow-visible">
      <div className="relative px-2 sm:px-4 md:px-8 overflow-visible">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black via-black/50 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black via-black/50 to-transparent z-20" />

        <div
          ref={scrollerRef}
          className="relative flex gap-12 md:gap-16 overflow-x-auto overflow-y-visible pb-12 hide-scrollbar px-4 md:px-8 pt-4"
        >
          {top10Items.map((it, index) => {
            const mt = 'title' in it ? 'movie' : 'tv'
            const href = `/${mt}/${it.id}`
            const poster = getTMDBImageUrl(it.poster_path || "", "w500") || getTMDBImageUrl(it.backdrop_path || "", "w500")
            const title = 'title' in it ? it.title : it.name
            const rank = index + 1

            return (
              <div
                key={`${mt}-${it.id}-${rank}`}
                className="relative group flex items-end flex-shrink-0 cursor-pointer pl-12 sm:pl-16 md:pl-20 overflow-visible"
                onClick={() => router.push(href)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(href)
                  }
                }}
              >
                {/* Rank number */}
                <div className="absolute left-0 bottom-0 z-0 pointer-events-none transition-all duration-500 group-hover:-translate-x-4 group-hover:z-30 group-hover:scale-110">
                  <div
                    className="text-[100px] sm:text-[120px] md:text-[150px] lg:text-[180px] font-black leading-[0.8] transition-all duration-500 text-black group-hover:text-[#0071eb] group-hover:drop-shadow-[0_0_15px_rgba(0,113,235,0.5)]"
                    style={{
                      WebkitTextStroke: "2px rgb(0, 113, 235)",
                    }}
                  >
                    {rank}
                  </div>
                </div>

                {/* Poster card */}
                <div className="relative z-10 w-28 sm:w-32 md:w-36 lg:w-40 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:z-20">
                  <div className="relative w-full aspect-[2/3]">
                    {poster ? (
                      <img
                        src={poster || "/placeholder.svg"}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                        No image
                      </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Title on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="text-white text-xs font-semibold line-clamp-2">{title}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

