import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components/footer"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="pt-16">
        {/* Hero skeleton */}
        <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center">
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            <Skeleton className="h-16 w-96 mx-auto mb-6" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-8" />
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-12">
          {/* Featured Movies skeleton */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="group">
                  <Skeleton className="w-full h-64 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          {/* Featured TV Shows skeleton */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="group">
                  <Skeleton className="w-full h-64 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
