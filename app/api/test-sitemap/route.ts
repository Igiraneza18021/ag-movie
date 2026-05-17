import { NextResponse } from 'next/server'
import { createStaticSupabaseClient } from '@/lib/supabase/static'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createStaticSupabaseClient()
    
    // Test database connection
    const { data: movies, error: moviesError } = await supabase
      .from("movies")
      .select("id, title, updated_at")
      .eq("status", "active")
      .limit(5)
    
    const { data: tvShows, error: tvShowsError } = await supabase
      .from("tv_shows")
      .select("id, name, updated_at")
      .eq("status", "active")
      .limit(5)

    if (moviesError) {
      return NextResponse.json({
        success: false,
        error: 'Movies query failed',
        details: moviesError.message
      }, { status: 500 })
    }

    if (tvShowsError) {
      return NextResponse.json({
        success: false,
        error: 'TV Shows query failed',
        details: tvShowsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        moviesCount: movies?.length || 0,
        tvShowsCount: tvShows?.length || 0,
        sampleMovies: movies || [],
        sampleTVShows: tvShows || []
      }
    })
  } catch (error) {
    console.error('Sitemap test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
