import type { Metadata } from 'next'
import type { Movie, TVShow } from '@/lib/types'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
const siteName = 'Agasobanuye Movies'

function dedupeKeywords(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))]
}

function buildAgasobanuyeLabel(title: string, narrator?: string) {
  const narratorLabel = String(narrator ?? '').trim()
  return narratorLabel ? `${title} Agasobanuye by ${narratorLabel}` : `${title} Agasobanuye`
}

export function generateMovieMetadata(movie: Movie): Metadata {
  const agasobanuyeTitle = buildAgasobanuyeLabel(movie.title, movie.narrator)
  const title = `${agasobanuyeTitle} - Watch Online | ${siteName}`
  const description = movie.overview 
    ? `${movie.overview.substring(0, 155)}... Watch ${agasobanuyeTitle} online on ${siteName}.`
    : `Watch ${agasobanuyeTitle} online in HD quality. Stream the latest movies on ${siteName}.`
  
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : `${baseUrl}/placeholder.jpg`
  const keywords = dedupeKeywords([
    movie.title,
    agasobanuyeTitle,
    `${movie.title} agasobanuye`,
    movie.narrator ? `${movie.title} agasobanuye by ${movie.narrator}` : null,
    movie.narrator ? `${movie.title} by ${movie.narrator}` : null,
    movie.narrator ? `${movie.narrator} agasobanuye` : null,
    `${movie.title} agasobanuye movie`,
    `${movie.title} watch online`,
    `${movie.title} streaming`,
    'Agasobanuye Movies',
    'agasobanuye',
    'agasobanuye movies',
    'watch online',
    'streaming',
    'HD movie',
    'movie streaming',
    'watch movies online',
    ...(movie.genres?.map(genre => genre.name) || []),
  ])

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: `${baseUrl}/movie/${movie.id}`,
      siteName,
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 500,
          height: 750,
          alt: `${agasobanuyeTitle} movie poster`,
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
  const agasobanuyeTitle = buildAgasobanuyeLabel(tvShow.name, tvShow.narrator)
  const title = `${agasobanuyeTitle} - Watch Online | ${siteName}`
  const description = tvShow.overview 
    ? `${tvShow.overview.substring(0, 155)}... Watch ${agasobanuyeTitle} online on ${siteName}.`
    : `Watch ${agasobanuyeTitle} online in HD quality. Stream the latest TV shows on ${siteName}.`
  
  const imageUrl = tvShow.poster_path 
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : `${baseUrl}/placeholder.jpg`
  const keywords = dedupeKeywords([
    tvShow.name,
    agasobanuyeTitle,
    `${tvShow.name} agasobanuye`,
    tvShow.narrator ? `${tvShow.name} agasobanuye by ${tvShow.narrator}` : null,
    tvShow.narrator ? `${tvShow.name} by ${tvShow.narrator}` : null,
    tvShow.narrator ? `${tvShow.narrator} agasobanuye` : null,
    `${tvShow.name} agasobanuye series`,
    `${tvShow.name} watch online`,
    `${tvShow.name} streaming`,
    'Agasobanuye Movies',
    'agasobanuye',
    'agasobanuye tv shows',
    'watch online',
    'streaming',
    'TV series',
    'HD TV show',
    'TV show streaming',
    'watch TV shows online',
    ...(tvShow.genres?.map(genre => genre.name) || []),
  ])

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'video.tv_show',
      url: `${baseUrl}/tv/${tvShow.id}`,
      siteName,
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 500,
          height: 750,
          alt: `${agasobanuyeTitle} TV show poster`,
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
