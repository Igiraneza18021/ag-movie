"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { findGenreByParams } from "@/lib/genres"
import type { Genre } from "@/lib/types"
import { Filter, X } from "lucide-react"

interface FilterSidebarProps {
  genres: Genre[]
  type: "movies" | "tv-shows" | "list"
}

export function FilterSidebar({ genres, type }: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const currentGenre = searchParams.get("genre")
  const currentGenreId = searchParams.get("genreId")
  const currentSort = searchParams.get("sort") || "newest"
  const currentYear = searchParams.get("year")
  const currentRating = searchParams.get("rating") || "0"
  const currentType = searchParams.get("type")
  const selectedGenre = findGenreByParams(genres, currentGenreId, currentGenre)
  const selectedGenreValue = selectedGenre ? selectedGenre.id : "all"

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === "genreId") {
      if (value) {
        const nextGenre = genres.find((genre) => genre.id === value || genre.tmdb_id.toString() === value)
        params.set("genreId", value)
        if (nextGenre) {
          params.set("genre", nextGenre.name)
        }
      } else {
        params.delete("genreId")
        params.delete("genre")
      }
    } else if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const basePath = type === 'list' ? '/list' : `/${type}`
    router.push(`${basePath}?${params.toString()}`)
  }

  const clearFilters = () => {
    const basePath = type === 'list' ? '/list' : `/${type}`
    router.push(basePath)
  }

  const hasActiveFilters = currentGenreId || currentGenre || currentYear || Number.parseFloat(currentRating) > 0 || currentType

  const currentYearInt = currentYear ? Number.parseInt(currentYear) : new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button onClick={() => setIsOpen(!isOpen)} variant="outline" className="w-full">
          <Filter className="h-4 w-4 mr-2" />
          Filters {hasActiveFilters && <Badge className="ml-2">Active</Badge>}
        </Button>
      </div>

      {/* Filter Sidebar */}
      <div className={`lg:block ${isOpen ? "block" : "hidden"} w-full lg:w-64 lg:self-start lg:sticky lg:top-24 space-y-4 lg:space-y-6`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filters</span>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type (only for list page) */}
            {type === 'list' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Content Type</label>
                <Select value={currentType || "all"} onValueChange={(value) => updateFilter("type", value === "all" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All content" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="movie">Movies Only</SelectItem>
                    <SelectItem value="tv">TV Shows Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
              <Select value={currentSort} onValueChange={(value) => updateFilter("sort", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Genre */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Genre</label>
              <Select value={selectedGenreValue} onValueChange={(value) => updateFilter("genreId", value === "all" ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Release Year</label>
              <Select value={currentYear || "any"} onValueChange={(value) => updateFilter("year", value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any year</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Minimum Rating: {currentRating}/10
              </label>
              <Slider
                value={[Number.parseFloat(currentRating)]}
                onValueChange={([value]) => updateFilter("rating", value > 0 ? value.toString() : null)}
                max={10}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
