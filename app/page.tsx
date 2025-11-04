import { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { MovieCarousel } from "@/components/movie-carousel"
import { TVShowCarousel } from "@/components/tv-show-carousel"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { FirstVisitRedirect } from "@/components/first-visit-redirect"
import { getMoviesServer, getTVShowsServer } from "@/lib/database"
import { generatePageMetadata } from "@/lib/seo"

export const metadata: Metadata = generatePageMetadata(
  "Home",
  "Watch the latest movies and TV shows online in HD quality. Stream trending movies, popular TV series, and discover new content on Agasobanuye Movies.",
  "/"
)

export default async function HomePage() {
  const [allMovies, allTVShows] = await Promise.all([
    getMoviesServer(50), // Get more movies for filtering
    getTVShowsServer(50),
  ])

  // Process movies for different sections
  const featuredMovies = allMovies.slice(0, 10)
  const trendingMovies = allMovies.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 20)
  const topRatedMovies = allMovies.filter((movie) => (movie.vote_average || 0) >= 8.0).slice(0, 20)

  // Process TV shows
  const featuredTVShows = allTVShows.slice(0, 10)
  const trendingTVShows = allTVShows.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 20)

  // Get hero movie (highest rated with backdrop)
  const heroMovie = featuredMovies.find((movie) => movie.backdrop_path) || featuredMovies[0]

  return (
    <FirstVisitRedirect>
      <div className="min-h-screen bg-background">
        <Navigation />

        {heroMovie && <HeroSection movie={heroMovie} />}

        <main className="relative z-10 -mt-32 space-y-12 pb-20 md:pb-20 pt-14 md:pt-0">
          {trendingMovies.length > 0 && <MovieCarousel title="Trending Movies" movies={trendingMovies} />}

          {topRatedMovies.length > 0 && <MovieCarousel title="Top Rated Movies" movies={topRatedMovies} />}

          {trendingTVShows.length > 0 && <TVShowCarousel title="Popular TV Shows" tvShows={trendingTVShows} />}

          {featuredTVShows.length > 0 && <TVShowCarousel title="Top Rated TV Shows" tvShows={featuredTVShows} />}
        </main>

        <Footer />
      </div>
    </FirstVisitRedirect>
  )
}
