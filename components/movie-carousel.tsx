"use client"

import { useState, useRef } from "react"
import { PosterCard } from "@/components/home/poster-card"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CarouselSkeleton } from "@/components/skeletons/carousel-skeleton"

interface MovieCarouselProps {
  title: string
  movies: Movie[]
  loading?: boolean
}

export function MovieCarousel({ title, movies, loading }: MovieCarouselProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newScrollLeft = container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)

    container.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    })
  }

  const handleScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  if (loading) {
    return <CarouselSkeleton title={title} itemCount={6} />
  }

  if (movies.length === 0) return null

  return (
    <div className="relative group">
      <div className="container mx-auto px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{title}</h2>

        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Movies Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 pt-4 px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((movie) => (
              <div key={movie.id} className="flex-none w-36 sm:w-48 lg:w-56">
                <PosterCard item={movie} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
