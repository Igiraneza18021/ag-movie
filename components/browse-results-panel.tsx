"use client"

import { useEffect, useState } from "react"
import { MovieGrid } from "@/components/movie-grid"
import { TVShowGrid } from "@/components/tv-show-grid"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Movie, TVShow } from "@/lib/types"

interface BrowseResultsPanelProps {
  mode: "movies" | "tv-shows"
  items: Movie[] | TVShow[]
  pageSize?: number
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
}

export function BrowseResultsPanel({ mode, items, pageSize = 36 }: BrowseResultsPanelProps) {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [items])

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * pageSize
  const paginatedItems = items.slice(startIndex, startIndex + pageSize)
  const visibleStart = totalItems === 0 ? 0 : startIndex + 1
  const visibleEnd = Math.min(startIndex + pageSize, totalItems)
  const visiblePages = buildVisiblePages(safeCurrentPage, totalPages)
  const itemLabel = mode === "movies" ? "movies" : "TV shows"

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex-1">
      <p className="mb-6 text-sm md:text-base text-muted-foreground">
        {totalItems === 0 ? `0 ${itemLabel} found` : `${visibleStart}-${visibleEnd} of ${totalItems} ${itemLabel}`}
      </p>

      {mode === "movies" ? (
        <MovieGrid movies={paginatedItems as Movie[]} />
      ) : (
        <TVShowGrid tvShows={paginatedItems as TVShow[]} />
      )}

      {totalPages > 1 && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={safeCurrentPage <= 1}
                className={safeCurrentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault()
                  if (safeCurrentPage > 1) handlePageChange(safeCurrentPage - 1)
                }}
              />
            </PaginationItem>

            {visiblePages.map((page, index) => {
              const previousPage = visiblePages[index - 1]
              const showEllipsis = typeof previousPage === "number" && page - previousPage > 1

              return (
                <div key={page} className="contents">
                  {showEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={page === safeCurrentPage}
                      onClick={(event) => {
                        event.preventDefault()
                        handlePageChange(page)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                </div>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={safeCurrentPage >= totalPages}
                className={safeCurrentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                onClick={(event) => {
                  event.preventDefault()
                  if (safeCurrentPage < totalPages) handlePageChange(safeCurrentPage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
