"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Movie, TVShow } from "@/lib/types"
import { PosterCard } from "./poster-card"

interface PortraitCategoryRowProps {
  title: string
  items: (Movie | TVShow)[]
}

export function PortraitCategoryRow({ title, items }: PortraitCategoryRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

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

  const scrollLeft = () => {
    if (scrollerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement
    const { scrollLeft, scrollWidth, clientWidth } = container
    
    setCanLeft(scrollLeft > 0)
    setCanRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  if (items.length === 0) return null

  return (
    <section 
      className="relative group mb-8 animate-slide-up"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="px-2 sm:px-4 md:px-8 mb-3 flex items-center justify-between">
        <h2 className="text-white text-2xl font-semibold">{title}</h2>
      </div>

      <div className="relative px-2 sm:px-4 md:px-8">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-2 md:left-8 w-10 bg-gradient-to-r from-[#090a0a] to-transparent hidden md:block z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-2 md:right-8 w-10 bg-gradient-to-l from-[#090a0a] to-transparent hidden md:block z-20" />

        {/* Navigation Buttons */}
        {canLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 z-30 flex items-center justify-start">
            <button
              onClick={scrollLeft}
              className={`p-3 rounded-full transition-all duration-300 bg-black/80 hover:bg-black/90 text-white shadow-2xl backdrop-blur-md border border-white/10 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        )}
        
        {canRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 z-30 flex items-center justify-end">
            <button
              onClick={scrollRight}
              className={`p-3 rounded-full transition-all duration-300 bg-black/80 hover:bg-black/90 text-white shadow-2xl backdrop-blur-md border border-white/10 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Desktop Grid */}
        <div 
          ref={scrollerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide py-4 pl-4 -ml-4 hidden md:flex"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' },
            touchAction: 'pan-x pan-y pinch-zoom',
            scrollBehavior: 'smooth'
          }}
        >
          {items.map((it, index) => {
            const mt = 'title' in it ? 'movie' : 'tv'
            return (
              <div key={`${mt}-${it.id}`} className="flex-shrink-0 animate-stagger" style={{animationDelay: `${index * 100}ms`}}>
                <PosterCard item={it} />
              </div>
            )
          })}
        </div>

        {/* Mobile Grid */}
        <div className="md:hidden flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 px-2">
          {items.map((it) => {
            const mt = 'title' in it ? 'movie' : 'tv'
            return (
              <PosterCard key={`mobile-${mt}-${it.id}`} item={it} />
            )
          })}
        </div>

        {/* Mobile view all link */}
        {items.length > 6 && (
          <div className="flex md:hidden justify-center mt-4 px-2">
            <a
              href="/movies"
              className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

