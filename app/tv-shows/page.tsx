import { Metadata } from "next"
import { BrowsePagination } from "@/components/browse-pagination"
import { Footer } from "@/components/footer"
import { TVShowGrid } from "@/components/tv-show-grid"
import { FilterSidebar } from "@/components/filter-sidebar"
import { getTVShowsServer } from "@/lib/database"
import { buildGenreOptions, contentHasGenre } from "@/lib/genres"
import { generatePageMetadata } from "@/lib/seo"

interface TVShowsPageProps {
  searchParams: Promise<{
    genre?: string
    genreId?: string
    page?: string
    sort?: string
    year?: string
    rating?: string
    search?: string
  }>
}

export const metadata: Metadata = generatePageMetadata(
  "TV Shows",
  "Watch the latest TV shows and series online. Stream HD TV shows from various genres including drama, comedy, action, sci-fi and more.",
  "/tv-shows"
)

export default async function TVShowsPage({ searchParams }: TVShowsPageProps) {
  const params = await searchParams
  const currentPage = Math.max(1, Number.parseInt(params.page || "1", 10) || 1)
  const pageSize = 36

  const allTVShows = await getTVShowsServer(2000)
  let filteredTVShows = allTVShows
  const genres = buildGenreOptions(allTVShows)

  // Apply search filter
  if (params.search) {
    filteredTVShows = filteredTVShows.filter((show) => show.name?.toLowerCase().includes(params.search!.toLowerCase()))
  }

  // Apply year filter
  if (params.year) {
    const year = Number.parseInt(params.year)
    filteredTVShows = filteredTVShows.filter((show) => {
      if (!show.first_air_date) return false
      const showYear = new Date(show.first_air_date).getFullYear()
      return showYear === year
    })
  }

  // Apply rating filter
  if (params.rating) {
    const minRating = Number.parseFloat(params.rating)
    filteredTVShows = filteredTVShows.filter((show) => (show.vote_average || 0) >= minRating)
  }

  // Filter by genre if specified
  if (params.genre || params.genreId) {
    filteredTVShows = filteredTVShows.filter((show) => contentHasGenre(show.genres, params.genreId, params.genre))
  }

  // Apply sorting
  switch (params.sort) {
    case "title":
      filteredTVShows.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      break
    case "year":
      filteredTVShows.sort((a, b) => {
        const yearA = a.first_air_date ? new Date(a.first_air_date).getFullYear() : 0
        const yearB = b.first_air_date ? new Date(b.first_air_date).getFullYear() : 0
        return yearB - yearA
      })
      break
    case "rating":
      filteredTVShows.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      break
    default:
      // Default sort by created_at (newest first)
      filteredTVShows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const totalTVShows = filteredTVShows.length
  const totalPages = Math.max(1, Math.ceil(totalTVShows / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedTVShows = filteredTVShows.slice(startIndex, startIndex + pageSize)
  const visibleStart = totalTVShows === 0 ? 0 : startIndex + 1
  const visibleEnd = Math.min(startIndex + pageSize, totalTVShows)

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16 md:pt-16 pb-24 md:pb-20">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">TV Shows</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {totalTVShows === 0 ? "0 TV shows found" : `${visibleStart}-${visibleEnd} of ${totalTVShows} TV shows`}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
            <FilterSidebar genres={genres} type="tv-shows" />
            <div className="flex-1">
              <TVShowGrid tvShows={paginatedTVShows} />
              <BrowsePagination
                basePath="/tv-shows"
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                searchParams={params}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
