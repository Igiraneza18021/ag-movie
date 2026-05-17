import { NextResponse } from 'next/server'
import { createStaticSupabaseClient } from '@/lib/supabase/static'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createStaticSupabaseClient()
    
    // Test database connection and sitemap data
    const [moviesResult, tvShowsResult] = await Promise.all([
      supabase
        .from("movies")
        .select("id, title, updated_at")
        .eq("status", "active")
        .or("part_number.is.null,part_number.eq.1")
        .limit(10),
      supabase
        .from("tv_shows")
        .select("id, name, updated_at")
        .eq("status", "active")
        .limit(10)
    ])

    const movies = moviesResult.data || []
    const tvShows = tvShowsResult.data || []
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
    
    // Generate XML sitemap
    const staticPages = [
      { url: baseUrl, priority: 1.0, changefreq: 'daily' },
      { url: `${baseUrl}/movies`, priority: 0.9, changefreq: 'daily' },
      { url: `${baseUrl}/tv-shows`, priority: 0.9, changefreq: 'daily' },
      { url: `${baseUrl}/categories`, priority: 0.8, changefreq: 'weekly' },
      { url: `${baseUrl}/coming-soon`, priority: 0.7, changefreq: 'daily' },
      { url: `${baseUrl}/search`, priority: 0.6, changefreq: 'monthly' },
      { url: `${baseUrl}/about`, priority: 0.7, changefreq: 'monthly' },
      { url: `${baseUrl}/team`, priority: 0.6, changefreq: 'monthly' },
      { url: `${baseUrl}/help`, priority: 0.6, changefreq: 'weekly' },
      { url: `${baseUrl}/faq`, priority: 0.6, changefreq: 'weekly' },
      { url: `${baseUrl}/contact`, priority: 0.5, changefreq: 'monthly' },
      { url: `${baseUrl}/privacy`, priority: 0.4, changefreq: 'yearly' },
      { url: `${baseUrl}/terms`, priority: 0.4, changefreq: 'yearly' },
    ]

    const moviePages = movies.map(movie => ({
      url: `${baseUrl}/movie/${movie.id}`,
      lastmod: movie.updated_at,
      priority: 0.8,
      changefreq: 'weekly'
    }))

    const tvShowPages = tvShows.map(tvShow => ({
      url: `${baseUrl}/tv/${tvShow.id}`,
      lastmod: tvShow.updated_at,
      priority: 0.8,
      changefreq: 'weekly'
    }))

    const allPages = [...staticPages, ...moviePages, ...tvShowPages]
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    allPages.forEach(page => {
      xml += '  <url>\n'
      xml += `    <loc>${page.url}</loc>\n`
      if (page.lastmod) {
        xml += `    <lastmod>${new Date(page.lastmod).toISOString().split('T')[0]}</lastmod>\n`
      } else {
        xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`
      }
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`
      xml += `    <priority>${page.priority}</priority>\n`
      xml += '  </url>\n'
    })
    
    xml += '</urlset>'

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    
    // Return minimal sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ag.micorp.pro'
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}</loc>\n`
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`
    xml += '    <changefreq>daily</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'
    xml += '</urlset>'

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes on error
      },
    })
  }
}
