"use client"

import { useState, useEffect } from "react"
import { getMovies, getTVShows } from "@/lib/database-client"
import { PortraitCategoryRow } from "./portrait-category-row"
import type { Movie, TVShow } from "@/lib/types"

export function ProviderSeriesSection() {
  const [selectedProvider, setSelectedProvider] = useState('all')
  const [selectedType, setSelectedType] = useState<'movie' | 'tv'>('movie')
  const [providerData, setProviderData] = useState<(Movie | TVShow)[]>([])
  const [loading, setLoading] = useState(false)

  const providerCategories = [
    { id: 'all', name: 'All Content' },
    { id: 'trending', name: 'Trending' },
    { id: 'top-rated', name: 'Top Rated' },
  ]

  useEffect(() => {
    const loadProviderData = async () => {
      setLoading(true)
      try {
        if (selectedProvider === 'all') {
          const [movies, tvShows] = await Promise.all([
            getMovies(20),
            getTVShows(20),
          ])
          
          const allItems = selectedType === 'movie' 
            ? movies 
            : tvShows

          setProviderData(allItems)
        } else if (selectedProvider === 'trending') {
          const [movies, tvShows] = await Promise.all([
            getMovies(20),
            getTVShows(20),
          ])
          
          const items = selectedType === 'movie' ? movies : tvShows
          const sorted = items.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
          setProviderData(sorted)
        } else if (selectedProvider === 'top-rated') {
          const [movies, tvShows] = await Promise.all([
            getMovies(20),
            getTVShows(20),
          ])
          
          const items = selectedType === 'movie' ? movies : tvShows
          const filtered = items.filter((item) => (item.vote_average || 0) >= 8.0)
          setProviderData(filtered)
        }
      } catch (error) {
        console.error('Error loading provider data:', error)
        setProviderData([])
      } finally {
        setLoading(false)
      }
    }

    loadProviderData()
  }, [selectedProvider, selectedType])

  return (
    <section className="py-8">
      {/* Header */}
      <div className="px-2 sm:px-4 md:px-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Browse <span className="text-primary">{providerCategories.find(p => p.id === selectedProvider)?.name}</span>
          </h2>
        </div>
        
        {/* Provider Tabs */}
        <div 
          className="flex items-center gap-4 sm:gap-6 mb-6 overflow-x-auto pb-2 hide-scrollbar"
          style={{
            touchAction: 'pan-x pinch-zoom',
            scrollBehavior: 'smooth'
          }}
        >
          {providerCategories.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`relative text-white font-medium transition-all duration-300 whitespace-nowrap px-2 py-1 ${
                selectedProvider === provider.id
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {provider.name}
              {selectedProvider === provider.id && (
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Media Type Toggle */}
        <div className="flex gap-1 bg-white/10 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSelectedType('movie')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedType === 'movie'
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setSelectedType('tv')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedType === 'tv'
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            TV Shows
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-2 sm:px-4 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : providerData.length > 0 ? (
          <PortraitCategoryRow 
            title={`${providerCategories.find(p => p.id === selectedProvider)?.name} ${selectedType === 'movie' ? 'Movies' : 'TV Shows'}`} 
            items={providerData} 
          />
        ) : (
          <div className="text-center py-12 text-white/60">
            No content available for {providerCategories.find(p => p.id === selectedProvider)?.name} {selectedType === 'movie' ? 'movies' : 'TV shows'}
          </div>
        )}
      </div>
    </section>
  )
}

