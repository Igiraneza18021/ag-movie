"use client"

import { PosterCard } from "@/components/home/poster-card"
import type { TVShow } from "@/lib/types"
import { TVShowGridSkeleton } from "@/components/skeletons/tv-show-grid-skeleton"

interface TVShowGridProps {
  tvShows: TVShow[]
  loading?: boolean
}

export function TVShowGrid({ tvShows, loading }: TVShowGridProps) {
  if (loading) {
    return <TVShowGridSkeleton count={12} />
  }

  if (tvShows.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-foreground mb-2">No TV Shows Found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
      {tvShows.map((show) => (
        <PosterCard key={show.id} item={show} />
      ))}
    </div>
  )
}
