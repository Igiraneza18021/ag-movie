import { MetadataRoute } from 'next'
import { createStaticSupabaseClient } from '@/lib/supabase/static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
  
      // Static pages that should always be included
      const staticPages: MetadataRoute.Sitemap = [
        {
          url: baseUrl,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 1,
        },
        {
          url: `${baseUrl}/movies`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
        },
        {
          url: `${baseUrl}/tv-shows`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
        },
        {
          url: `${baseUrl}/categories`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        },
        {
          url: `${baseUrl}/coming-soon`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.7,
        },
        {
          url: `${baseUrl}/search`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        },
        {
          url: `${baseUrl}/about`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        },
        {
          url: `${baseUrl}/team`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        },
        {
          url: `${baseUrl}/help`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        },
        {
          url: `${baseUrl}/faq`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        },
        {
          url: `${baseUrl}/contact`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        },
        {
          url: `${baseUrl}/privacy`,
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 0.4,
        },
        {
          url: `${baseUrl}/terms`,
          lastModified: new Date(),
          changeFrequency: 'yearly',
          priority: 0.4,
        },
      ]

  try {
    const supabase = createStaticSupabaseClient()
    
    // Get all movies and TV shows with error handling
    const [moviesResult, tvShowsResult] = await Promise.all([
      supabase
        .from("movies")
        .select("id, title, updated_at")
        .eq("status", "active")
        .or("part_number.is.null,part_number.eq.1") // Only include standalone movies or Part 1
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("tv_shows")
        .select("id, name, updated_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1000)
    ])

    const movies = moviesResult.data || []
    const tvShows = tvShowsResult.data || []

    // Movie pages
    const moviePages: MetadataRoute.Sitemap = movies.map((movie) => ({
      url: `${baseUrl}/movie/${movie.id}`,
      lastModified: movie.updated_at ? new Date(movie.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // TV Show pages
    const tvShowPages: MetadataRoute.Sitemap = tvShows.map((tvShow) => ({
      url: `${baseUrl}/tv/${tvShow.id}`,
      lastModified: tvShow.updated_at ? new Date(tvShow.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    return [...staticPages, ...moviePages, ...tvShowPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // Return just static pages if database fails
    return staticPages
  }
}
