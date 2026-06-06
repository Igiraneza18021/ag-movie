import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { SearchResults } from "@/components/search-results"
import { createClient } from "@/lib/supabase/server"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: "all" | "movies" | "tv-shows"
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ""
  const type = params.type || "all"

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <main className="pt-32">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center py-20">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter">Start Searching</h1>
              <p className="text-zinc-500 text-lg md:text-xl max-w-lg mx-auto">
                Enter a title in the search bar above to find your favorite Agasobanuye movies and TV shows.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const supabase = await createClient()

  // Search movies and TV shows
  const searchPromises = []

  if (type === "all" || type === "movies") {
    searchPromises.push(
      supabase
        .from("movies")
        .select("*")
        .eq("status", "active")
        .or("part_number.is.null,part_number.eq.1")
        .ilike("title", `%${query}%`)
        .order("vote_average", { ascending: false })
        .limit(30),
    )
  } else {
    searchPromises.push(Promise.resolve({ data: [] }))
  }

  if (type === "all" || type === "tv-shows") {
    searchPromises.push(
      supabase
        .from("tv_shows")
        .select("*")
        .eq("status", "active")
        .ilike("name", `%${query}%`)
        .order("vote_average", { ascending: false })
        .limit(30),
    )
  } else {
    searchPromises.push(Promise.resolve({ data: [] }))
  }

  const [{ data: movies }, { data: tvShows }] = await Promise.all(searchPromises)
  const totalResults = (movies?.length || 0) + (tvShows?.length || 0)

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="pt-32">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-12 border-b border-white/5 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter">
              Results for: <span className="text-[#0071eb] underline decoration-4 underline-offset-8">{query}</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
              {totalResults} matching item{totalResults !== 1 ? "s" : ""} found
            </p>
          </div>

          <SearchResults movies={movies || []} tvShows={tvShows || []} query={query} type={type} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
