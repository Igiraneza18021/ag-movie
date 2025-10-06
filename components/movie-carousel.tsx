"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WatchlistButton } from "@/components/watchlist-button"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"
import { ChevronLeft, ChevronRight, Play, Mic } from "lucide-react"
import Link from "next/link"
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
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {movies.map((movie) => (
              <Link key={movie.id} href={`/movie/${movie.id}`} className="flex-none w-36 sm:w-48 group/item cursor-pointer">
                <div className="relative overflow-hidden rounded-lg bg-card">
                  <img
                    src={getTMDBImageUrl(movie.poster_path || "") || "/placeholder.svg?height=288&width=192"}
                    alt={movie.title}
                    className="w-full h-52 sm:h-72 object-cover transition-transform group-hover/item:scale-105"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={(e) => e.preventDefault()}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <WatchlistButton
                        id={movie.id.toString()}
                        type="movie"
                        title={movie.title}
                        poster_path={movie.poster_path || ""}
                        vote_average={movie.vote_average || 0}
                        release_date={movie.release_date || ""}
                        variant="outline"
                        size="sm"
                        showText={false}
                      />
                    </div>
                  </div>

                  {/* Rating Badge */}
                  {movie.vote_average && (
                    <Badge className="absolute top-2 right-2 text-xs">★ {movie.vote_average.toFixed(1)}</Badge>
                  )}

                  {/* Narrator Badge */}
                  {movie.narrator && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      <Mic className="h-3 w-3" />
                      <span className="truncate">{movie.narrator}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 sm:mt-3">
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm truncate">{movie.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
