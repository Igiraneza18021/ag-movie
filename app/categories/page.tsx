import { Footer } from "@/components/footer"
import { GenreCard } from "@/components/genre-card"
import { createClient } from "@/lib/supabase/server"

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Get all genres with content counts
  const { data: genres, error: genresError } = await supabase.from("genres").select("*").order("name")

  // Handle error or null genres
  if (genresError || !genres) {
    console.error("Error fetching genres:", genresError)
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading Categories</h3>
              <p className="text-muted-foreground">Unable to load categories at this time. Please try again later.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Handle empty genres array
  if (genres.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Browse by Category</h1>
              <p className="text-muted-foreground">Discover movies and TV shows by genre</p>
            </div>
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No Categories Available</h3>
              <p className="text-muted-foreground">Categories will appear here once content is added.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Get movie and TV show counts for each genre
  const genresWithCounts = await Promise.all(
    genres.map(async (genre) => {
      try {
        // Use the working filter approach with JSONB contains operator
        const { count: movieCount } = await supabase
          .from("movies")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .or("part_number.is.null,part_number.eq.1") // Only count standalone movies or Part 1
          .filter("genres", "cs", `[{"id": ${genre.tmdb_id}}]`)
        
        const { count: tvShowCount } = await supabase
          .from("tv_shows")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .filter("genres", "cs", `[{"id": ${genre.tmdb_id}}]`)

        return {
          ...genre,
          movieCount: movieCount || 0,
          tvShowCount: tvShowCount || 0,
          totalCount: (movieCount || 0) + (tvShowCount || 0),
        }
      } catch (error) {
        console.error(`Error getting counts for genre ${genre.name}:`, error)
        return {
          ...genre,
          movieCount: 0,
          tvShowCount: 0,
          totalCount: 0,
        }
      }
    }),
  )

  // Filter out genres with no content and sort by total count
  const activeGenres = genresWithCounts
    .filter((genre) => genre.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount)

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Browse by Category</h1>
            <p className="text-muted-foreground">Discover movies and TV shows by genre</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeGenres.map((genre) => (
              <GenreCard key={genre.id} genre={genre} />
            ))}
          </div>

          {activeGenres.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No Categories Available</h3>
              <p className="text-muted-foreground">Categories will appear here once content is added.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
