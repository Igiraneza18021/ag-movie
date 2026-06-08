import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function isOlderThan(timestamp: string | null | undefined, ageMs: number) {
  if (!timestamp) return false
  return Date.now() - new Date(timestamp).getTime() >= ageMs
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return await performWatchStatusSync()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.trigger !== "manual") {
      return NextResponse.json({ error: "Invalid trigger" }, { status: 400 })
    }

    return await performWatchStatusSync()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

async function performWatchStatusSync() {
  const supabase = await createClient()

  try {
    const { data: watchlistEntries, error: watchlistError } = await supabase
      .from("watchlist_entries")
      .select("id, item_type, movie_id, tv_show_id, watch_status")
      .in("watch_status", ["watching", "re_watching", "paused"])

    if (watchlistError) throw watchlistError

    const movieIds = (watchlistEntries ?? [])
      .map((entry) => entry.movie_id)
      .filter((value): value is string => Boolean(value))
    const tvShowIds = (watchlistEntries ?? [])
      .map((entry) => entry.tv_show_id)
      .filter((value): value is string => Boolean(value))

    const [{ data: movieProgressRows, error: movieProgressError }, { data: showProgressRows, error: showProgressError }] =
      await Promise.all([
        movieIds.length
          ? supabase
              .from("watch_progress_entries")
              .select("movie_id, last_watched_at")
              .eq("content_type", "movie")
              .in("movie_id", movieIds)
          : Promise.resolve({ data: [], error: null }),
        tvShowIds.length
          ? supabase
              .from("tv_show_progress_entries")
              .select("tv_show_id, last_watched_at")
              .in("tv_show_id", tvShowIds)
          : Promise.resolve({ data: [], error: null }),
      ])

    if (movieProgressError) throw movieProgressError
    if (showProgressError) throw showProgressError

    const movieProgressById = new Map(
      ((movieProgressRows as Array<{ movie_id: string; last_watched_at: string }> | null) ?? []).map((row) => [
        row.movie_id,
        row.last_watched_at,
      ]),
    )
    const showProgressById = new Map(
      ((showProgressRows as Array<{ tv_show_id: string; last_watched_at: string }> | null) ?? []).map((row) => [
        row.tv_show_id,
        row.last_watched_at,
      ]),
    )

    const updates = []

    for (const entry of watchlistEntries ?? []) {
      const lastWatchedAt =
        entry.item_type === "movie"
          ? movieProgressById.get(entry.movie_id)
          : showProgressById.get(entry.tv_show_id)

      if (entry.watch_status === "paused" && isOlderThan(lastWatchedAt, NINETY_DAYS_MS)) {
        updates.push({ id: entry.id, watch_status: "dropped" })
        continue
      }

      if (
        (entry.watch_status === "watching" || entry.watch_status === "re_watching") &&
        isOlderThan(lastWatchedAt, THIRTY_DAYS_MS)
      ) {
        updates.push({ id: entry.id, watch_status: "paused" })
      }
    }

    for (const update of updates) {
      const { error } = await supabase.from("watchlist_entries").update({ watch_status: update.watch_status }).eq("id", update.id)
      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      results: updates,
    })
  } catch (error) {
    console.error("Watch status sync error:", error)
    return NextResponse.json({ error: "Failed to sync watch statuses" }, { status: 500 })
  }
}
