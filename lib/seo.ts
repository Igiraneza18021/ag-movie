import type { Metadata } from 'next'
import type { Movie, TVShow } from '@/lib/types'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
const siteName = 'Agasobanuye Movies'

export function generateMovieMetadata(movie: Movie): Metadata {
  const title = `${movie.title} - Watch Online | ${siteName}`
  const description = movie.overview 
    ? `${movie.overview.substring(0, 155)}...` 
    : `Watch ${movie.title} online in HD quality. Stream the latest movies on ${siteName}.`
  
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : `${baseUrl}/placeholder.jpg`

  return {
    title,
    description,
    keywords: [
      movie.title,
      'watch online',
      'streaming',
      'HD movie',
      ...(movie.genres?.map(genre => genre.name) || [])
    ],
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: `${baseUrl}/movie/${movie.id}`,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 500,
          height: 750,
          alt: `${movie.title} movie poster`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/movie/${movie.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function generateTVShowMetadata(tvShow: TVShow): Metadata {
  const title = `${tvShow.name} - Watch Online | ${siteName}`
  const description = tvShow.overview 
    ? `${tvShow.overview.substring(0, 155)}...` 
    : `Watch ${tvShow.name} online in HD quality. Stream the latest TV shows on ${siteName}.`
  
  const imageUrl = tvShow.poster_path 
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : `${baseUrl}/placeholder.jpg`

  return {
    title,
    description,
    keywords: [
      tvShow.name,
      'watch online',
      'streaming',
      'TV series',
      'HD TV show',
      ...(tvShow.genres?.map(genre => genre.name) || [])
    ],
    openGraph: {
      title,
      description,
      type: 'video.tv_show',
      url: `${baseUrl}/tv/${tvShow.id}`,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 500,
          height: 750,
          alt: `${tvShow.name} TV show poster`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/tv/${tvShow.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export function generatePageMetadata(
  title: string, 
  description: string, 
  path: string,
  image?: string
): Metadata {
  const fullTitle = `${title} | ${siteName}`
  const imageUrl = image || `${baseUrl}/placeholder.jpg`

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: `${baseUrl}${path}`,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
