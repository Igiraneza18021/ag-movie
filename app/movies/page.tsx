import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { MovieGrid } from "@/components/movie-grid"
import { FilterSidebar } from "@/components/filter-sidebar"
import { getMoviesServer } from "@/lib/database"
import { buildGenreOptions, contentHasGenre } from "@/lib/genres"
import { generatePageMetadata } from "@/lib/seo"

interface MoviesPageProps {
  searchParams: Promise<{
    genre?: string
    genreId?: string
    sort?: string
    year?: string
    rating?: string
    search?: string
  }>
}

export const metadata: Metadata = generatePageMetadata(
  "Movies",
  "Browse and watch the latest movies online. Stream HD movies from various genres including action, comedy, drama, thriller and more.",
  "/movies"
)

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams

  const allMovies = await getMoviesServer(200)
  let filteredMovies = allMovies
  const genres = buildGenreOptions(allMovies)

  // Apply search filter
  if (params.search) {
    filteredMovies = filteredMovies.filter((movie) => movie.title?.toLowerCase().includes(params.search!.toLowerCase()))
  }

  // Apply year filter
  if (params.year) {
    const year = Number.parseInt(params.year)
    filteredMovies = filteredMovies.filter((movie) => {
      if (!movie.release_date) return false
      const movieYear = new Date(movie.release_date).getFullYear()
      return movieYear === year
    })
  }

  // Apply rating filter
  if (params.rating) {
    const minRating = Number.parseFloat(params.rating)
    filteredMovies = filteredMovies.filter((movie) => (movie.vote_average || 0) >= minRating)
  }

  // Filter by genre if specified
  if (params.genre || params.genreId) {
    filteredMovies = filteredMovies.filter((movie) => contentHasGenre(movie.genres, params.genreId, params.genre))
  }

  // Apply sorting
  switch (params.sort) {
    case "title":
      filteredMovies.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
      break
    case "year":
      filteredMovies.sort((a, b) => {
        const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0
        const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0
        return yearB - yearA
      })
      break
    case "rating":
      filteredMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      break
    default:
      // Default sort by created_at (newest first)
      filteredMovies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16 md:pt-16 pb-24 md:pb-20">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Movies</h1>
            <p className="text-sm md:text-base text-muted-foreground">{filteredMovies.length} movies found</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <FilterSidebar genres={genres} type="movies" />
            <div className="flex-1">
              <MovieGrid movies={filteredMovies} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
