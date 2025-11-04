"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SpotlightSection } from "@/components/details/spotlight-section"
import { BackdropGallery } from "@/components/details/backdrop-gallery"
import { CategorySection } from "@/components/details/category-section"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"
import Link from "next/link"
import { Play, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MovieDetailsProps {
  movie: Movie
  relatedMovies?: Movie[]
}

export function MovieDetails({ movie, relatedMovies = [] }: MovieDetailsProps) {
  const [movieParts, setMovieParts] = useState<Movie[]>([])
  const [showTrailerModal, setShowTrailerModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "more">("overview")
  const router = useRouter()
  const searchParams = useSearchParams()
  const showDownloads = searchParams.get("dl") === "1"

  // Load movie parts if this is a multi-part movie
  useEffect(() => {
    const loadMovieParts = async () => {
      // TODO: Load movie parts from database
      // For now, we'll skip this if not needed
    }
    if (movie.parent_movie_id || (movie.part_number && movie.part_number >= 1)) {
      loadMovieParts()
    }
  }, [movie.id, movie.parent_movie_id, movie.part_number])

  // Create backdrop images array (mock for now - you'd fetch from TMDB)
  const backdropImages = movie.backdrop_path
    ? [{ file_path: movie.backdrop_path }]
    : []

  const handleWatchClick = () => {
    router.push(`/watch/movie/${movie.id}`)
  }

  const handleTrailerClick = () => {
    setShowTrailerModal(true)
  }

  return (
    <div className="min-h-screen bg-[#090a0a] pb-12 md:pb-0">
      {/* Spotlight/Hero Section */}
      <SpotlightSection
        item={movie}
        mediaType="movie"
        isLoading={false}
        onWatchClick={handleWatchClick}
        onTrailerClick={handleTrailerClick}
        showDownloads={showDownloads}
      />

      {/* Tab Navigation */}
      {!showDownloads && (
        <div className="px-8 pt-6">
          <div className="flex gap-2 border-b border-gray-700 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === "overview"
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Overview
            </button>

            {relatedMovies.length > 0 && (
              <button
                onClick={() => setActiveTab("more")}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === "more"
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                More Like This
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-8 pb-8 pt-6">
        {showDownloads ? (
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-4">Downloads</h2>
            {movie.download_url ? (
              <a
                href={movie.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#E50914] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B20710] transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Movie
              </a>
            ) : (
              <p className="text-gray-400">No download links available.</p>
            )}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Backdrop Gallery */}
                {backdropImages.length > 0 && (
                  <BackdropGallery title="Images" images={backdropImages} item={movie} />
                )}

                {/* Movie Parts */}
                {movieParts.length > 1 && (
                  <div className="mb-8">
                    <h2 className="text-2xl text-white mb-4">Movie Parts ({movieParts.length} parts)</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {movieParts.map((part) => (
                        <Card
                          key={part.id}
                          className={`hover:bg-accent transition-colors ${
                            part.id === movie.id ? "ring-2 ring-primary bg-accent" : ""
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getTMDBImageUrl(part.poster_path, "w92") || "/placeholder.svg"}
                                alt={part.title}
                                className="w-16 h-24 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate text-white">{part.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Part {part.part_number}
                                  {part.id === movie.id && " (Current)"}
                                </p>
                                {part.runtime && (
                                  <p className="text-xs text-muted-foreground mb-2">{part.runtime} min</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/movie/${part.id}`}>
                                      <Play className="h-3 w-3 mr-1" />
                                      Watch
                                    </Link>
                                  </Button>
                                  {part.download_url && (
                                    <Button asChild size="sm" variant="outline">
                                      <a href={part.download_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* More Like This Tab */}
            {activeTab === "more" && relatedMovies.length > 0 && (
              <CategorySection
                title="More Like This"
                items={relatedMovies}
                isLoading={false}
                renderItem={(item) => (
                  <Link href={`/movie/${item.id}`} className="block">
                    <div className="relative group cursor-pointer">
                      <img
                        src={getTMDBImageUrl(item.poster_path, "w342") || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover rounded-lg transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold text-sm line-clamp-2">{item.title}</h3>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
                layout="horizontal"
              />
            )}
          </>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && movie.trailer_url && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="relative bg-black/95 rounded-xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-white/10 mx-auto my-auto">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 bg-black/50 backdrop-blur-sm">
              <h3 className="text-white text-lg md:text-xl font-semibold">Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-white hover:text-red-400 hover:bg-white/10 transition-all duration-200 p-2 rounded-full group cursor-pointer relative z-30"
              >
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 md:p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src={movie.trailer_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Trailer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
