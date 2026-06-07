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

    const safeProgressSeconds = Math.max(0, Number(progress_seconds || 0))
    const safeDurationSeconds = duration_seconds ? Math.max(0, Number(duration_seconds)) : null
    const progress_percent = safeDurationSeconds ? Math.min(100, (safeProgressSeconds / safeDurationSeconds) * 100) : 0
    const is_completed = progress_percent >= 95

    const now = new Date().toISOString()

    const { data: existing, error: existingError } = await supabase
      .from("watch_progress_entries")
      .select("id, is_completed, rewatch_count, started_at")
      .eq("user_id", user.id)
      .match(content_type === 'movie' ? { movie_id } : { episode_id })
      .maybeSingle()

    if (existingError) {
      console.error("Error loading existing watch progress:", existingError)
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    let rewatch_count = existing?.rewatch_count || 0
    let started_at = existing?.started_at || now
    let final_is_completed = is_completed
    let completed_at = final_is_completed ? now : null

    if (existing?.is_completed && safeProgressSeconds < 60) {
      rewatch_count += 1
      final_is_completed = false
      completed_at = null
    }

    const { error } = await supabase
      .from("watch_progress_entries")
      .upsert({
        user_id: user.id,
        content_type,
        movie_id: content_type === 'movie' ? movie_id : null,
        tv_show_id: content_type === 'episode' ? tv_show_id : null,
        season_id: content_type === 'episode' ? season_id : null,
        episode_id: content_type === 'episode' ? episode_id : null,
        progress_seconds: safeProgressSeconds,
        duration_seconds: safeDurationSeconds,
        progress_percent,
        is_completed: final_is_completed,
        started_at,
        rewatch_count,
        last_watched_at: now,
        updated_at: now,
        completed_at,
      }, {
        onConflict: content_type === 'movie' ? 'user_id,movie_id' : 'user_id,episode_id'
      })

    if (error) {
      console.error("Error saving watch progress:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (content_type === "episode" && tv_show_id) {
      const [{ count: totalEpisodeCount, error: totalEpisodesError }, { data: firstEpisode, error: firstEpisodeError }] = await Promise.all([
        supabase
          .from("episodes")
          .select("id", { count: "exact", head: true })
          .eq("tv_show_id", tv_show_id),
        supabase
          .from("episodes")
          .select("id")
          .eq("tv_show_id", tv_show_id)
          .order("season_number", { ascending: true })
          .order("episode_number", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ])

      if (totalEpisodesError || firstEpisodeError) {
        const dbError = totalEpisodesError ?? firstEpisodeError
        console.error("Error loading TV show episode metadata:", dbError)
        return NextResponse.json({ error: dbError?.message ?? "Unable to load episode metadata" }, { status: 500 })
      }

      const { count: completedEpisodeCount, error: completedEpisodesError } = await supabase
        .from("watch_progress_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("content_type", "episode")
        .eq("tv_show_id", tv_show_id)
        .eq("is_completed", true)

      if (completedEpisodesError) {
        console.error("Error loading completed episode count:", completedEpisodesError)
        return NextResponse.json({ error: completedEpisodesError.message }, { status: 500 })
      }

      const totalEpisodes = totalEpisodeCount ?? 0
      const completedEpisodes = completedEpisodeCount ?? 0
      const showProgressPercent = totalEpisodes > 0 ? Math.min(100, (completedEpisodes / totalEpisodes) * 100) : 0
      const showCompleted = totalEpisodes > 0 && completedEpisodes >= totalEpisodes

      const { data: existingShowProgress, error: existingShowProgressError } = await supabase
        .from("tv_show_progress_entries")
        .select("id, is_completed, rewatch_count, started_at")
        .eq("user_id", user.id)
        .eq("tv_show_id", tv_show_id)
        .maybeSingle()

      if (existingShowProgressError) {
        console.error("Error loading TV show progress:", existingShowProgressError)
        return NextResponse.json({ error: existingShowProgressError.message }, { status: 500 })
      }

      let showRewatchCount = existingShowProgress?.rewatch_count ?? 0
      const showStartedAt = existingShowProgress?.started_at ?? now
      const restartingCompletedSeries =
        existingShowProgress?.is_completed &&
        safeProgressSeconds < 60 &&
        firstEpisode?.id === episode_id

      if (restartingCompletedSeries) {
        showRewatchCount += 1
      }

      const { error: showProgressError } = await supabase
        .from("tv_show_progress_entries")
        .upsert(
          {
            user_id: user.id,
            tv_show_id,
            started_at: showStartedAt,
            last_watched_at: now,
            completed_episode_count: completedEpisodes,
            total_episode_count_snapshot: totalEpisodes,
            progress_percent: showProgressPercent,
            is_completed: restartingCompletedSeries ? false : showCompleted,
            rewatch_count: showRewatchCount,
            completed_at: restartingCompletedSeries ? null : showCompleted ? now : null,
            updated_at: now,
          },
          {
            onConflict: "user_id,tv_show_id",
          },
        )

      if (showProgressError) {
        console.error("Error saving TV show progress:", showProgressError)
        return NextResponse.json({ error: showProgressError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Watch progress error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
