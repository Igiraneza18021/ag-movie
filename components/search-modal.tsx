"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import { searchTMDBSearchMulti, getTMDBImageUrl } from "@/lib/tmdb"
import Link from "next/link"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  id: number
  media_type: "movie" | "tv"
  title?: string
  name?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  vote_count?: number
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (pathname.startsWith("/anime")) {
        return
      }

      // Close with Escape
      if (e.key === "Escape") {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, pathname])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = "hidden"
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    if (!query.trim()) return

    try {
      setIsLoading(true)
      setShowResults(false)

      const data = await searchTMDBSearchMulti(query, 1)

      // Filter out people and limit to 20 results
      const filteredResults = data.results
        .filter(
          (item: any) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            item.vote_average > 0.0 &&
            item.vote_count >= 3
        )
        .slice(0, 20)

      setSearchResults(filteredResults)

      // Trigger animation
      if (filteredResults.length > 0) {
        setTimeout(() => setShowResults(true), 50)
      }
    } catch (err) {
      console.error("Error searching:", err)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = (item: SearchResult) => {
    const path = item.media_type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`
    router.push(path)
    handleClose()
  }

  const handleClose = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
    onClose()
  }

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md"
      onClick={handleBackgroundClick}
    >
      <div className="w-full max-w-3xl mx-4">
        <div className="mb-4">
          <div className="bg-zinc-900/90 border border-zinc-800 hover:border-primary/50 rounded-2xl px-6 py-3 mx-2 flex items-center gap-3 shadow-2xl backdrop-blur-xl transition-all duration-300">
            <Search className="w-5 h-5 text-primary" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies and TV shows..."
              className="flex-1 bg-transparent text-white text-base font-medium placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={handleClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        {(searchResults.length > 0 || (searchQuery.trim() && !isLoading)) && (
          <div
            ref={resultsRef}
            className="overflow-y-auto space-y-3 rounded-xl p-2"
            style={{ maxHeight: "calc(100vh - 550px)" }}
          >
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ease-out shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] border border-zinc-800/50 hover:border-primary/50 ${
                    showResults ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                  }`}
                  style={{
                    backgroundImage: item.backdrop_path
                      ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.6) 100%), url(https://image.tmdb.org/t/p/w780${item.backdrop_path})`
                      : item.poster_path
                        ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.6) 100%), url(https://image.tmdb.org/t/p/w780${item.poster_path})`
                        : "linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(39,39,42,0.95) 100%)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    transitionDelay: showResults ? `${index * 40}ms` : "0ms",
                  }}
                >
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 h-36 overflow-hidden rounded-lg shadow-2xl z-20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-0 rotate-2">
                    <img
                      src={
                        item.poster_path
                          ? getTMDBImageUrl(item.poster_path, "w185")
                          : `https://placehold.co/185x278/18181b/fff/?text=${encodeURIComponent(item.title || item.name || "Unknown")}&font=poppins`
                      }
                      alt={item.title || item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary rounded-lg transition-colors duration-300"></div>
                  </div>
                  <div className="relative z-10 bg-black/40 backdrop-blur-md px-6 py-5 rounded-2xl group-hover:bg-black/50 transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div className="w-24 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg truncate drop-shadow-lg group-hover:text-primary transition-colors duration-300">
                          {item.title || item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2.5 py-0.5 bg-primary/20 border border-primary/30 text-primary text-xs font-semibold rounded-full">
                            {item.media_type === "movie" ? "Movie" : "TV Show"}
                          </span>
                          {item.release_date || item.first_air_date ? (
                            <span className="text-zinc-400 text-sm font-medium">
                              {new Date(item.release_date || item.first_air_date).getFullYear()}
                            </span>
                          ) : null}
                          {item.vote_average && item.vote_average > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-zinc-300 text-sm font-semibold">
                                {item.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-zinc-300 text-sm mt-2 line-clamp-2 min-h-[2.5em] drop-shadow-lg leading-relaxed">
                          {item.overview ? item.overview : "No description available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery.trim() ? (
              <div
                className={`bg-zinc-900/90 border border-zinc-800 rounded-2xl px-6 py-8 transition-all duration-300 ease-out backdrop-blur-xl ${
                  !isLoading ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <Search className="w-12 h-12 text-zinc-700" />
                  <p className="text-zinc-400 text-base font-medium">No results found for "{searchQuery}"</p>
                  <p className="text-zinc-600 text-sm">Try searching with different keywords</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}