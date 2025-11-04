"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import { MoviePlayer } from "@/components/movie-player"
import { createClient } from "@/lib/supabase/client"
import type { Movie } from "@/lib/types"

interface WatchMoviePageProps {
  params: Promise<{ id: string }>
}

export default function WatchMoviePage({ params }: WatchMoviePageProps) {
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const { id } = await params
        const supabase = createClient()
        const { data, error } = await supabase
          .from("movies")
          .select("*")
          .eq("id", id)
          .eq("status", "active")
          .single()

        if (error || !data) {
          notFound()
          return
        }

        setMovie(data)
      } catch (error) {
        console.error("Error loading movie:", error)
        notFound()
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
    notFound()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 w-full h-full overflow-hidden">
      <MoviePlayer movie={movie} autoPlay={true} />
    </div>
  )
}

