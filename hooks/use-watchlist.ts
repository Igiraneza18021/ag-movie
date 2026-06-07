"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type {
  WatchlistEntry,
  WatchlistItemType,
  WatchlistMediaSummary,
  WatchlistSaveInput,
} from "@/lib/types"

type RawWatchlistRow = {
  id: string
  user_id: string
  item_type: WatchlistItemType
  movie_id: string | null
  tv_show_id: string | null
  watch_status: WatchlistEntry["watch_status"]
  progress: number
  score: number | null
  start_date: string | null
  end_date: string | null
  total_rewatched: number
  notes: string | null
  liked: boolean
  created_at: string
  updated_at: string
  movie?: {
    id: string
    title: string
    poster_path: string | null
    release_date: string | null
    vote_average: number | null
  } | null
  tv_show?: {
    id: string
    name: string
    poster_path: string | null
    first_air_date: string | null
    vote_average: number | null
    number_of_episodes: number | null
  } | null
}

function normalizeWatchlistRow(row: RawWatchlistRow): WatchlistEntry {
  const media: WatchlistMediaSummary =
    row.item_type === "movie"
      ? {
          id: row.movie_id ?? row.movie?.id ?? "",
          type: "movie",
          title: row.movie?.title ?? "Untitled movie",
          poster_path: row.movie?.poster_path ?? null,
          vote_average: row.movie?.vote_average ?? null,
          release_date: row.movie?.release_date ?? null,
        }
      : {
          id: row.tv_show_id ?? row.tv_show?.id ?? "",
          type: "tv",
          title: row.tv_show?.name ?? "Untitled show",
          poster_path: row.tv_show?.poster_path ?? null,
          vote_average: row.tv_show?.vote_average ?? null,
          first_air_date: row.tv_show?.first_air_date ?? null,
          number_of_episodes: row.tv_show?.number_of_episodes ?? null,
        }

  return {
    id: row.id,
    user_id: row.user_id,
    item_type: row.item_type,
    movie_id: row.movie_id,
    tv_show_id: row.tv_show_id,
    watch_status: row.watch_status,
    progress: row.progress,
    score: row.score,
    start_date: row.start_date,
    end_date: row.end_date,
    total_rewatched: row.total_rewatched,
    notes: row.notes,
    liked: row.liked,
    created_at: row.created_at,
    updated_at: row.updated_at,
    media,
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const getNextPath = useCallback(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  const promptLogin = useCallback(
    (nextPath?: string) => {
      const destination = nextPath ?? getNextPath()
      router.push(`/login?next=${encodeURIComponent(destination)}`)
    },
    [getNextPath, router],
  )

  const fetchWatchlist = useCallback(
    async (currentUserId: string) => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("watchlist_entries")
        .select(
          `
            id,
            user_id,
            item_type,
            movie_id,
            tv_show_id,
            watch_status,
            progress,
            score,
            start_date,
            end_date,
            total_rewatched,
            notes,
            liked,
            created_at,
            updated_at,
            movie:movies (
              id,
              title,
              poster_path,
              release_date,
              vote_average
            ),
            tv_show:tv_shows (
              id,
              name,
              poster_path,
              first_air_date,
              vote_average,
              number_of_episodes
            )
          `,
        )
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading watchlist:", error)
        setWatchlist([])
        setIsLoading(false)
        return
      }

      setWatchlist(((data as RawWatchlistRow[] | null) ?? []).map(normalizeWatchlistRow))
      setIsLoading(false)
    },
    [supabase],
  )

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      const nextUserId = user?.id ?? null
      setUserId(nextUserId)

      if (!nextUserId) {
        setWatchlist([])
        setIsLoading(false)
        return
      }

      await fetchWatchlist(nextUserId)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      setUserId(nextUserId)

      if (!nextUserId) {
        setWatchlist([])
        setIsLoading(false)
        return
      }

      void fetchWatchlist(nextUserId)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchWatchlist, supabase])

  const getEntryByItem = useCallback(
    (id: string, type: WatchlistItemType) =>
      watchlist.find((entry) => entry.media.id === id && entry.item_type === type) ?? null,
    [watchlist],
  )

  const isInWatchlist = useCallback(
    (id: string, type: WatchlistItemType) => watchlist.some((entry) => entry.media.id === id && entry.item_type === type),
    [watchlist],
  )

  const saveWatchlistEntry = useCallback(
    async (input: WatchlistSaveInput) => {
      if (!userId) {
        promptLogin()
        return { ok: false as const, reason: "unauthenticated" }
      }

      const payload = {
        user_id: userId,
        item_type: input.item.type,
        movie_id: input.item.type === "movie" ? input.item.id : null,
        tv_show_id: input.item.type === "tv" ? input.item.id : null,
        watch_status: input.watch_status,
        progress: input.progress,
        score: input.score,
        start_date: input.start_date,
        end_date: input.end_date,
        total_rewatched: input.total_rewatched,
        notes: input.notes.trim() ? input.notes.trim() : null,
        liked: input.liked,
      }

      const query = input.entryId
        ? supabase.from("watchlist_entries").update(payload).eq("id", input.entryId)
        : supabase.from("watchlist_entries").insert(payload)

      const { error } = await query

      if (error) {
        console.error("Error saving watchlist entry:", error)
        return { ok: false as const, reason: error.message }
      }

      await fetchWatchlist(userId)
      return { ok: true as const }
    },
    [fetchWatchlist, promptLogin, supabase, userId],
  )

  const deleteWatchlistEntry = useCallback(
    async (entryId: string) => {
      if (!userId) {
        promptLogin()
        return { ok: false as const, reason: "unauthenticated" }
      }

      const { error } = await supabase.from("watchlist_entries").delete().eq("id", entryId)

      if (error) {
        console.error("Error deleting watchlist entry:", error)
        return { ok: false as const, reason: error.message }
      }

      await fetchWatchlist(userId)
      return { ok: true as const }
    },
    [fetchWatchlist, promptLogin, supabase, userId],
  )

  const clearWatchlist = useCallback(async () => {
    if (!userId) return
    const { error } = await supabase.from("watchlist_entries").delete().eq("user_id", userId)
    if (error) {
      console.error("Error clearing watchlist:", error)
      return
    }
    setWatchlist([])
  }, [supabase, userId])

  return {
    watchlist,
    isLoading,
    isAuthenticated: Boolean(userId),
    promptLogin,
    saveWatchlistEntry,
    deleteWatchlistEntry,
    clearWatchlist,
    getEntryByItem,
    isInWatchlist,
  }
}
