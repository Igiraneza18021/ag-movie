import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      content_type, 
      movie_id, 
      tv_show_id, 
      season_id, 
      episode_id, 
      progress_seconds, 
      duration_seconds 
    } = await request.json()

    if (!content_type || (content_type === 'movie' && !movie_id) || (content_type === 'episode' && !episode_id)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const progress_percent = duration_seconds ? (progress_seconds / duration_seconds) * 100 : 0
    const is_completed = progress_percent > 95 // Mark as completed if > 95%

    // Upsert watch progress
    const { error } = await supabase
      .from("watch_progress_entries")
      .upsert({
        user_id: user.id,
        content_type,
        movie_id: content_type === 'movie' ? movie_id : null,
        tv_show_id: content_type === 'episode' ? tv_show_id : null,
        season_id: content_type === 'episode' ? season_id : null,
        episode_id: content_type === 'episode' ? episode_id : null,
        progress_seconds,
        duration_seconds,
        progress_percent,
        is_completed,
        last_watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(is_completed ? { completed_at: new Date().toISOString() } : {})
      }, {
        onConflict: content_type === 'movie' ? 'user_id,movie_id' : 'user_id,episode_id'
      })

    if (error) {
      console.error("Error saving watch progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Watch progress error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
