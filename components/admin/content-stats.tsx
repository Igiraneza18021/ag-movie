"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Film, Tv, Clock, TrendingUp, RefreshCw } from "lucide-react"
import { AutoReleaseStatus } from "./auto-release-status"

interface Stats {
  movies: number
  tvShows: number
  comingSoon: number
  totalEpisodes: number
}

export function ContentStats() {
  const [stats, setStats] = useState<Stats>({ movies: 0, tvShows: 0, comingSoon: 0, totalEpisodes: 0 })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const [moviesResult, tvShowsResult, comingSoonMoviesResult, comingSoonTVResult, episodesResult] =
        await Promise.all([
          supabase.from("movies").select("id", { count: "exact" }).eq("status", "active").or("part_number.is.null,part_number.eq.1"),
          supabase.from("tv_shows").select("id", { count: "exact" }).eq("status", "active"),
          supabase.from("movies").select("id", { count: "exact" }).eq("status", "coming_soon").or("part_number.is.null,part_number.eq.1"),
          supabase.from("tv_shows").select("id", { count: "exact" }).eq("status", "coming_soon"),
          supabase.from("episodes").select("id", { count: "exact" }),
        ])

      setStats({
        movies: moviesResult.count || 0,
        tvShows: tvShowsResult.count || 0,
        comingSoon: (comingSoonMoviesResult.count || 0) + (comingSoonTVResult.count || 0),
        totalEpisodes: episodesResult.count || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const interval = window.setInterval(() => {
      fetchStats()
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  const statCards = [
    {
      title: "Movies",
      value: stats.movies,
      icon: Film,
      description: "Active movies",
    },
    {
      title: "TV Shows",
      value: stats.tvShows,
      icon: Tv,
      description: "Active TV shows",
    },
    {
      title: "Episodes",
      value: stats.totalEpisodes,
      icon: TrendingUp,
      description: "Total episodes",
    },
    {
      title: "Coming Soon",
      value: stats.comingSoon,
      icon: Clock,
      description: "Scheduled releases",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={fetchStats} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AutoReleaseStatus />
    </div>
  )
}
