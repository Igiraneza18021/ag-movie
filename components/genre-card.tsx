"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Film, Tv } from "lucide-react"
import Link from "next/link"

interface GenreCardProps {
  genre: {
    id: string
    tmdb_id: number
    name: string
    movieCount: number
    tvShowCount: number
    totalCount: number
  }
}

export function GenreCard({ genre }: GenreCardProps) {
  const href = `/list?genreId=${genre.tmdb_id}&genre=${encodeURIComponent(genre.name)}`

  return (
    <Card className="group hover:bg-accent/50 transition-colors cursor-pointer">
      <Link href={href}>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
              {genre.name}
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{genre.movieCount} movies</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{genre.tvShowCount} TV shows</span>
              </div>
            </div>

            <Badge variant="secondary" className="mt-4">
              {genre.totalCount} total
            </Badge>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
