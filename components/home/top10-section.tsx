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
    <section className="relative py-8 md:py-12">
      {/* Header */}
      <div className="px-2 sm:px-4 md:px-8 mb-6 flex items-center gap-4">
        <h2
          className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-primary tracking-tighter"
          style={{
            WebkitTextStroke: "2px rgba(99, 102, 241, 0.5)",
            textShadow: "0 0 30px rgba(99, 102, 241, 0.3)",
          }}
        >
          TOP 10
        </h2>
        <div className="block">
          <div className="text-white text-sm font-bold tracking-widest">CONTENT</div>
          <div className="text-white text-sm font-bold tracking-widest">TODAY</div>
        </div>
      </div>

      <div className="relative px-2 sm:px-4 md:px-8">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#090a0a] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#090a0a] to-transparent z-10" />

        {/* Navigation buttons */}
        {canLeft && (
          <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-16 z-30 items-center justify-start">
            <button
              onClick={() => scrollBy(-1)}
              className="p-3 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-300"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        )}
        {canRight && (
          <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-16 z-30 items-center justify-end">
            <button
              onClick={() => scrollBy(1)}
              className="p-3 rounded-full bg-black/80 hover:bg-black/90 text-white shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-300"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        <div
          ref={scrollerRef}
          className="relative flex gap-16 md:gap-20 overflow-x-auto overflow-y-hidden pb-2 hide-scrollbar px-4 md:px-8"
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
                className="relative group flex items-end flex-shrink-0 cursor-pointer"
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
                <div className="absolute -left-8 sm:-left-10 md:-left-12 bottom-0 z-0 pointer-events-none transition-transform duration-300 group-hover:-translate-x-4">
                  <div
                    className="text-[80px] sm:text-[100px] md:text-[120px] lg:text-[140px] font-black leading-none transition-all duration-300"
                    style={{
                      color: "transparent",
                      WebkitTextStroke: "3px rgb(99, 102, 241)",
                      textShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    <span
                      className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                      style={{
                        color: "rgb(99, 102, 241)",
                        WebkitTextStroke: "none",
                        textShadow: "none",
                      }}
                    >
                      {rank}
                    </span>
                    <span className="relative z-10">{rank}</span>
                  </div>
                </div>

                {/* Poster card */}
                <div className="relative z-10 w-28 sm:w-32 md:w-36 lg:w-40 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 group-hover:border-white/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
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

        {/* Mobile controls */}
        <div className="flex md:hidden justify-end gap-2 mt-3 pr-1">
          <button
            onClick={() => scrollBy(-1)}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

