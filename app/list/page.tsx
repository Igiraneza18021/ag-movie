import { Metadata } from "next"
import { Footer } from "@/components/footer"
import { MovieGrid } from "@/components/movie-grid"
import { TVShowGrid } from "@/components/tv-show-grid"
import { FilterSidebar } from "@/components/filter-sidebar"
import { getMoviesServer, getTVShowsServer } from "@/lib/database"
import { buildGenreOptions, contentHasGenre, findGenreByParams } from "@/lib/genres"
import { generatePageMetadata } from "@/lib/seo"

interface ListPageProps {
  searchParams: Promise<{
    genre?: string
    genreId?: string
    type?: string
    sort?: string
    year?: string
    rating?: string
    search?: string
  }>
}

export const metadata: Metadata = generatePageMetadata(
  "Browse Content",
  "Browse movies and TV shows by genre, year, rating and more. Discover your next favorite movie or TV series.",
  "/list"
)

export default async function ListPage({ searchParams }: ListPageProps) {
  const params = await searchParams

  // Get all movies and TV shows
  const [allMovies, allTVShows] = await Promise.all([
    getMoviesServer(200),
    getTVShowsServer(200),
  ])

  let filteredMovies = allMovies
  let filteredTVShows = allTVShows
  const allGenres = buildGenreOptions([...allMovies, ...allTVShows])

  // Apply search filter
  if (params.search) {
    const searchTerm = params.search.toLowerCase()
    filteredMovies = filteredMovies.filter((movie) => 
      movie.title?.toLowerCase().includes(searchTerm)
    )
    filteredTVShows = filteredTVShows.filter((show) => 
      show.name?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply year filter
  if (params.year) {
    const year = Number.parseInt(params.year)
    filteredMovies = filteredMovies.filter((movie) => {
      if (!movie.release_date) return false
      const movieYear = new Date(movie.release_date).getFullYear()
      return movieYear === year
    })
    filteredTVShows = filteredTVShows.filter((show) => {
      if (!show.first_air_date) return false
      const showYear = new Date(show.first_air_date).getFullYear()
      return showYear === year
    })
  }

  // Apply rating filter
  if (params.rating) {
    const minRating = Number.parseFloat(params.rating)
    filteredMovies = filteredMovies.filter((movie) => (movie.vote_average || 0) >= minRating)
    filteredTVShows = filteredTVShows.filter((show) => (show.vote_average || 0) >= minRating)
  }

  // Filter by genre if specified
  if (params.genre) {
    filteredMovies = filteredMovies.filter((movie) => {
      return contentHasGenre(movie.genres, params.genreId, params.genre)
    })
    filteredTVShows = filteredTVShows.filter((show) => {
      return contentHasGenre(show.genres, params.genreId, params.genre)
    })
  }

  if (params.genreId && !params.genre) {
    filteredMovies = filteredMovies.filter((movie) => contentHasGenre(movie.genres, params.genreId, null))
    filteredTVShows = filteredTVShows.filter((show) => contentHasGenre(show.genres, params.genreId, null))
  }

  // Apply sorting
  const sortItems = (items: any[], type: 'movie' | 'tv') => {
    switch (params.sort) {
      case "title":
        return items.sort((a, b) => {
          const titleA = (type === 'movie' ? a.title : a.name) || ""
          const titleB = (type === 'movie' ? b.title : b.name) || ""
          return titleA.localeCompare(titleB)
        })
      case "year":
        return items.sort((a, b) => {
          const dateA = type === 'movie' ? a.release_date : a.first_air_date
          const dateB = type === 'movie' ? b.release_date : b.first_air_date
          const yearA = dateA ? new Date(dateA).getFullYear() : 0
          const yearB = dateB ? new Date(dateB).getFullYear() : 0
          return yearB - yearA
        })
      case "rating":
        return items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      default:
        return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }

  filteredMovies = sortItems(filteredMovies, 'movie')
  filteredTVShows = sortItems(filteredTVShows, 'tv')

  // Get all unique genres for filter sidebar
  const selectedGenre = findGenreByParams(allGenres, params.genreId, params.genre)

  // Determine what to show based on type parameter
  const showMovies = params.type !== 'tv'
  const showTVShows = params.type !== 'movie'

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16 md:pt-16 pb-24 md:pb-20">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {selectedGenre ? `${selectedGenre.name} Content` : "Browse Content"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {showMovies && showTVShows 
                  ? `${filteredMovies.length} movies and ${filteredTVShows.length} TV shows found`
                  : showMovies 
                    ? `${filteredMovies.length} movies found`
                    : `${filteredTVShows.length} TV shows found`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <FilterSidebar genres={allGenres} type="list" />
            <div className="flex-1 space-y-8">
              {showMovies && filteredMovies.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Movies</h2>
                  <MovieGrid movies={filteredMovies} />
                </div>
              )}

              {showTVShows && filteredTVShows.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">TV Shows</h2>
                  <TVShowGrid tvShows={filteredTVShows} />
                </div>
              )}

              {filteredMovies.length === 0 && filteredTVShows.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Content Found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
