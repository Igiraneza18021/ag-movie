import { Footer } from "@/components/footer"
import { RequestMovieForm } from "@/components/request-movie-form"

interface RequestMoviePageProps {
  searchParams: Promise<{
    title?: string
    type?: "movie" | "tv_show"
  }>
}

export default async function RequestMoviePage({ searchParams }: RequestMoviePageProps) {
  const params = await searchParams
  const title = params.title || ""
  const type = params.type || "movie"

  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Request Content</h1>
              <p className="text-muted-foreground">
                Can't find what you're looking for? Let us know and we'll try to add it!
              </p>
            </div>

            <RequestMovieForm initialTitle={title} initialType={type} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
