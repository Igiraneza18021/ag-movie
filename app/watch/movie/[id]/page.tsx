"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MoviePlayer } from "@/components/movie-player"
import { createClient } from "@/lib/supabase/client"
import { isTransientFetchError, runSupabaseQueryWithRetry } from "@/lib/supabase/retry"
import type { Movie } from "@/lib/types"

interface WatchMoviePageProps {
  params: Promise<{ id: string }>
}

export default function WatchMoviePage({ params }: WatchMoviePageProps) {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const loadMovie = async () => {
      setLoading(true)
      setError("")
      setMovie(null)

      try {
        const { id } = await params
        const supabase = createClient()
        const { data, error } = await runSupabaseQueryWithRetry<Movie>(() =>
          supabase
            .from("movies")
            .select("*")
            .eq("id", id)
            .eq("status", "active")
            .maybeSingle(),
        )

        if (error || !data) {
          setError("Movie was not found or is not available.")
          return
        }

        setMovie(data)
      } catch (error) {
        console.error("Error loading movie:", error)
        setError(
          isTransientFetchError(error)
            ? "The movie service is temporarily unreachable. Please refresh in a moment."
            : "This movie could not be loaded.",
        )
      } finally {
        setLoading(false)
      }
    }
    loadMovie()
  }, [params])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center text-white">
          <h1 className="text-2xl font-semibold">Movie unavailable</h1>
          <p className="mt-3 text-sm text-white/70">{error || "This movie could not be found."}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 w-full h-full overflow-hidden">
      <MoviePlayer movie={movie} autoPlay={true} />
    </div>
  )
}
