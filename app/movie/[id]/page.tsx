import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { MovieDetails } from "@/components/movie-details"
import { StructuredData } from "@/components/seo/structured-data"
import { getMovieByIdServer, getMoviesServer } from "@/lib/database"
import { generateMovieMetadata } from "@/lib/seo"

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const movie = await getMovieByIdServer(id)
    
    if (!movie) {
      return {
        title: 'Movie Not Found',
        description: 'The requested movie could not be found.'
      }
    }
    
    return generateMovieMetadata(movie)
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: 'Movie Not Found',
      description: 'The requested movie could not be found.'
    }
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  try {
    const { id } = await params

    const movie = await getMovieByIdServer(id)

    if (!movie) {
      notFound()
    }

    const allMovies = await getMoviesServer(100)
    const movieGenres = Array.isArray(movie.genres) ? movie.genres.map((g: any) => g.id) : []
    const relatedMovies = allMovies
      .filter((relatedMovie) => {
        if (relatedMovie.id === id) return false
        const relatedGenres = Array.isArray(relatedMovie.genres) ? relatedMovie.genres.map((g: any) => g.id) : []
        return movieGenres.some((genreId) => relatedGenres.includes(genreId))
      })
      .slice(0, 20)

    // Find next movie (could be next part or related movie)
    const nextMovie = relatedMovies[0] || null

    return (
      <div className="min-h-screen bg-[#090a0a]">
        <StructuredData type="movie" data={movie} />
        <Navigation />

        <main>
          <MovieDetails movie={movie} relatedMovies={relatedMovies} />
        </main>

        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error loading movie page:", error)
    notFound()
  }
}
