"use client"

import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Trash2, Calendar, Star } from "lucide-react"
import { useWatchlist } from "@/hooks/use-watchlist"
import Link from "next/link"
import Image from "next/image"

export default function WatchlistPage() {
  const { watchlist, isLoading, removeFromWatchlist, clearWatchlist } = useWatchlist()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-96 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-96 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Watchlist</h1>
              <p className="text-muted-foreground">
                {watchlist.length > 0
                  ? `${watchlist.length} ${watchlist.length === 1 ? "item" : "items"} saved to watch later`
                  : "Keep track of movies and TV shows you want to watch"}
              </p>
            </div>

            {watchlist.length > 0 && (
              <Button
                variant="outline"
                onClick={clearWatchlist}
                className="text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Your Watchlist is Empty</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding movies and TV shows to your watchlist by browsing our collection
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/movies">Browse Movies</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tv-shows">Browse TV Shows</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchlist.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <Link href={item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`}>
                      <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                        <Image
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                              : "/placeholder.svg?height=750&width=500"
                          }
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                        {/* Rating Badge */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-black/70 text-white">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {item.vote_average.toFixed(1)}
                          </Badge>
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge variant={item.type === "movie" ? "default" : "secondary"}>
                            {item.type === "movie" ? "Movie" : "TV Show"}
                          </Badge>
                        </div>
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link href={item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`}>
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                      </Link>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {item.release_date || item.first_air_date
                            ? new Date(item.release_date || item.first_air_date!).getFullYear()
                            : "TBA"}
                        </div>
                        <div className="text-xs">Added {new Date(item.addedAt).toLocaleDateString()}</div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromWatchlist(item.id, item.type)}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
