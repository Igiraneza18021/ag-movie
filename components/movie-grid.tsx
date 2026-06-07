"use client"

import { PosterCard } from "@/components/home/poster-card"
import type { Movie } from "@/lib/types"
import { MovieGridSkeleton } from "@/components/skeletons/movie-grid-skeleton"

interface MovieGridProps {
  movies: Movie[]
  loading?: boolean
}

export function MovieGrid({ movies, loading }: MovieGridProps) {
  if (loading) {
    return <MovieGridSkeleton count={12} />
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-foreground mb-2">No Movies Found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
      {movies.map((movie) => (
        <PosterCard key={movie.id} item={movie} />
      ))}
    </div>
  )
}
