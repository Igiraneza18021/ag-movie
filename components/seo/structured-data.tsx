import type { Movie, TVShow } from "@/lib/types"

interface StructuredDataProps {
  type: 'movie' | 'tvshow'
  data: Movie | TVShow
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
  
  if (type === 'movie') {
    const movie = data as Movie
    const movieStructuredData = {
      "@context": "https://schema.org",
      "@type": "Movie",
      "name": movie.title,
      "description": movie.overview,
      "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
      "datePublished": movie.release_date,
      "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
      "aggregateRating": movie.vote_average ? {
        "@type": "AggregateRating",
        "ratingValue": movie.vote_average,
        "ratingCount": movie.vote_count,
        "bestRating": 10,
        "worstRating": 0
      } : undefined,
      "genre": movie.genres?.map(genre => genre.name) || [],
      "url": `${baseUrl}/movie/${movie.id}`,
      "sameAs": movie.tmdb_id ? `https://www.themoviedb.org/movie/${movie.tmdb_id}` : undefined,
      "publisher": {
        "@type": "Organization",
        "name": "Agasobanuye Movies",
        "url": baseUrl
      }
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(movieStructuredData, null, 2),
        }}
      />
    )
  }

  if (type === 'tvshow') {
    const tvShow = data as TVShow
    const tvShowStructuredData = {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      "name": tvShow.name,
      "description": tvShow.overview,
      "image": tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : undefined,
      "datePublished": tvShow.first_air_date,
      "dateModified": tvShow.last_air_date,
      "numberOfSeasons": tvShow.number_of_seasons,
      "numberOfEpisodes": tvShow.number_of_episodes,
      "aggregateRating": tvShow.vote_average ? {
        "@type": "AggregateRating",
        "ratingValue": tvShow.vote_average,
        "ratingCount": tvShow.vote_count,
        "bestRating": 10,
        "worstRating": 0
      } : undefined,
      "genre": tvShow.genres?.map(genre => genre.name) || [],
      "url": `${baseUrl}/tv/${tvShow.id}`,
      "sameAs": tvShow.tmdb_id ? `https://www.themoviedb.org/tv/${tvShow.tmdb_id}` : undefined,
      "publisher": {
        "@type": "Organization",
        "name": "Agasobanuye Movies",
        "url": baseUrl
      }
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(tvShowStructuredData, null, 2),
        }}
      />
    )
  }

  return null
}
