"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie, TVShow } from "@/lib/types"

interface BackdropGalleryProps {
  title: string
  images: Array<{ file_path: string }>
  item: Movie | TVShow
}

function makeBackdropName(item: Movie | TVShow, idx: number): string {
  const base = ((item as Movie).title || (item as TVShow).name || "backdrop")
    .toLowerCase()
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return `${base}-backdrop-${idx + 1}.jpg`
}

async function downloadTmdbImage(filePath: string, nameHint: string) {
  const url = getTMDBImageUrl(filePath)
  try {
    const res = await fetch(url, { mode: "cors" })
    const blob = await res.blob()
    const a = document.createElement("a")
    const obj = URL.createObjectURL(blob)
    a.href = obj
    a.download = nameHint
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(obj)
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

export function BackdropGallery({ title, images, item }: BackdropGalleryProps) {
  const ref = useRef<HTMLDivElement>(null)

  if (!images?.length) return null

  const scrollByAmount = () => Math.round((ref.current?.clientWidth || 800) * 0.9)

  const doScroll = (dir: number) => {
    if (!ref.current) return
    ref.current.scrollBy({ left: dir * scrollByAmount(), behavior: "smooth" })
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") doScroll(1)
    if (e.key === "ArrowLeft") doScroll(-1)
  }

  const itemTitle = (item as Movie).title || (item as TVShow).name || "Title"

  return (
    <div className="mb-8 animate-slide-up" onKeyDown={onKey} tabIndex={0} aria-label={`${title} gallery`}>
      <div className="flex justify-between items-center mb-1 items-end">
        <h2 className="text-2xl text-white">{title}</h2>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => doScroll(-1)}
            aria-label="Scroll left"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => doScroll(1)}
            aria-label="Scroll right"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="relative flex space-x-4 overflow-x-auto scrollbar-hide py-4 pl-4 -ml-4 group"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Left/Right gradient hints */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#090a0a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#090a0a] to-transparent" />

        {images.map((img, index) => (
          <div key={img.file_path || index} className="relative w-[320px] md:w-[420px] lg:w-[520px] flex-shrink-0">
            <img
              src={getTMDBImageUrl(img.file_path)}
              alt={`${itemTitle} backdrop`}
              className="w-full h-[180px] md:h-[240px] lg:h-[300px] object-cover rounded-lg border border-white/10"
              loading="lazy"
              decoding="async"
            />

            {/* Download button overlay */}
            <div className="absolute top-2 right-2">
              <button
                onClick={() => downloadTmdbImage(img.file_path, makeBackdropName(item, index))}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-md border border-white/20"
                aria-label="Download image"
                title="Download"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile arrows */}
      <div className="mt-2 flex md:hidden justify-center gap-3">
        <button
          onClick={() => doScroll(-1)}
          aria-label="Scroll left"
          className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => doScroll(1)}
          aria-label="Scroll right"
          className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

