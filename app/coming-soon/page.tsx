import { Footer } from "@/components/footer"
import { ComingSoonGrid } from "@/components/coming-soon-grid"
import { createClient } from "@/lib/supabase/server"

export default async function ComingSoonPage() {
  const supabase = await createClient()

  // Fetch coming soon movies and TV shows
  const [{ data: movies }, { data: tvShows }] = await Promise.all([
    supabase
      .from("movies")
      .select("*")
      .eq("status", "coming_soon")
      .or("part_number.is.null,part_number.eq.1") // Only show standalone movies or Part 1
      .order("scheduled_release", { ascending: true, nullsLast: true }),
    supabase
      .from("tv_shows")
      .select("*")
      .eq("status", "coming_soon")
      .order("scheduled_release", { ascending: true, nullsLast: true }),
  ])

  const comingSoonItems = [
    ...(movies || []).map((item) => ({ ...item, type: "movie" as const })),
    ...(tvShows || []).map((item) => ({ ...item, type: "tv_show" as const })),
  ].sort((a, b) => {
    if (!a.scheduled_release && !b.scheduled_release) return 0
    if (!a.scheduled_release) return 1
    if (!b.scheduled_release) return -1
    return new Date(a.scheduled_release).getTime() - new Date(b.scheduled_release).getTime()
  })

  return (
    <div className="min-h-screen bg-background">

      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Coming Soon</h1>
            <p className="text-muted-foreground">
              Get ready for these upcoming movies and TV shows. {comingSoonItems.length} titles scheduled for release.
            </p>
          </div>

          <ComingSoonGrid items={comingSoonItems} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
