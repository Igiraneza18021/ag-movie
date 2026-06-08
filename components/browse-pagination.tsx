import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface BrowsePaginationProps {
  basePath: string
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

function buildPageHref(basePath: string, searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === "page") continue
    params.set(key, value)
  }

  if (page > 1) {
    params.set("page", page.toString())
  }

  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}

function buildVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
}

export function BrowsePagination({ basePath, currentPage, totalPages, searchParams }: BrowsePaginationProps) {
  if (totalPages <= 1) return null

  const visiblePages = buildVisiblePages(currentPage, totalPages)

  return (
    <Pagination className="mt-10">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildPageHref(basePath, searchParams, Math.max(1, currentPage - 1))}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
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
                <PaginationLink href={buildPageHref(basePath, searchParams, page)} isActive={page === currentPage}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            </div>
          )
        })}

        <PaginationItem>
          <PaginationNext
            href={buildPageHref(basePath, searchParams, Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
