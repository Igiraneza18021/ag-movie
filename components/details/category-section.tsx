"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CategorySectionProps<T> {
  title: string
  items: T[]
  isLoading?: boolean
  renderItem: (item: T, index: number) => React.ReactNode
  layout?: "horizontal" | "grid"
  headerComponent?: React.ReactNode
  episodeCount?: number
}

export function CategorySection<T>({
  title,
  items,
  isLoading,
  renderItem,
  layout = "horizontal",
  headerComponent,
  episodeCount = 0,
}: CategorySectionProps<T>) {
  const [visibleItems, setVisibleItems] = useState(layout === "grid" ? (title === "Episodes" ? items.length : 8) : items.length)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (layout === "horizontal" || title === "Episodes" || title === "Cast & Crew") {
      setVisibleItems(items.length)
    } else {
      setVisibleItems(layout === "grid" ? 8 : items.length)
    }
  }, [items, title, layout])

  useEffect(() => {
    updateScrollButtons()

    const container = scrollContainerRef.current
    if (container) {
      const resizeObserver = new ResizeObserver(updateScrollButtons)
      resizeObserver.observe(container)
      return () => resizeObserver.disconnect()
    }
  }, [items, visibleItems])

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement
    updateScrollButtons()
  }

  const getAnimationDelay = (index: number) => {
    if (title !== "Episodes") return index * 100
    const baseDelay = 100
    const speedMultiplier = Math.max(
      0.2,
      1 - (episodeCount > 25 ? Math.min((episodeCount - 25) / 75, 0.8) : 0)
    )
    return index * (baseDelay * speedMultiplier)
  }

  const displayedItems = items.slice(0, visibleItems)

  if (isLoading) {
    return (
      <div className="mb-8 animate-slide-up">
        <h2 className="text-2xl text-white mb-4">{title}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!items.length) return null

  return (
    <div
      className="mb-8 animate-slide-up relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center mb-1 items-end">
        <h2 className="text-2xl text-white">{title}</h2>
        {headerComponent}
      </div>

      {/* Navigation Buttons - Only for horizontal layout */}
      {layout !== "grid" && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-16 z-30 flex items-center justify-start">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={`p-3 rounded-full transition-all duration-300 ${
                canScrollLeft
                  ? "bg-black/80 hover:bg-black/90 text-white shadow-2xl"
                  : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
              } backdrop-blur-md border border-white/10 ${isHovered ? "opacity-100" : "opacity-0"}`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-16 z-30 flex items-center justify-end">
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={`p-3 rounded-full transition-all duration-300 ${
                canScrollRight
                  ? "bg-black/80 hover:bg-black/90 text-white shadow-2xl"
                  : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
              } backdrop-blur-md border border-white/10 ${isHovered ? "opacity-100" : "opacity-0"}`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}

      {layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-4">
          {displayedItems.map((item, index) => (
            <div key={index} className="animate-stagger" style={{ animationDelay: `${getAnimationDelay(index)}ms` }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto overflow-y-hidden scrollbar-hide py-4 pl-4 -ml-4"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitScrollbar: { display: "none" },
            touchAction: "pan-x pinch-zoom",
            scrollBehavior: "smooth",
          }}
        >
          {displayedItems.map((item, index) => (
            <div key={index} className="animate-stagger" style={{ animationDelay: `${getAnimationDelay(index)}ms` }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

