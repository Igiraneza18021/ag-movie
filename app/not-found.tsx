import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Home, Search, Film, Tv, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-primary mb-4 animate-pulse">
                404
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-primary to-purple-600 mx-auto rounded-full"></div>
            </div>

            {/* Error Message */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold text-foreground mb-4">
                  Page Not Found
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
                </p>
                
                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/browse">
                      <Home className="h-5 w-5 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/search">
                      <Search className="h-5 w-5 mr-2" />
                      Search Content
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="group hover:bg-accent transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Film className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Movies</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Browse our collection of movies
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/movies">
                      Explore Movies
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:bg-accent transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Tv className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">TV Shows</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Discover amazing TV series
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/tv-shows">
                      Explore TV Shows
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please{" "}
                <Link href="/search" className="text-primary hover:underline">
                  try searching
                </Link>{" "}
                for what you're looking for.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
