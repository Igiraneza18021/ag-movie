import type { Movie, TVShow } from "@/lib/types"

const FALLBACK_SITE_URL = "https://ag.micorp.pro"
const SHARE_SITE_NAME = "Ag Movies"

type ShareableItem = Movie | TVShow
type MediaType = "movie" | "tv"

function trimOverview(text?: string, maxLength = 110) {
  if (!text) return ""

  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized

  const sliced = normalized.slice(0, maxLength).trim()
  const lastSpace = sliced.lastIndexOf(" ")

  return `${(lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}.`
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function getShareBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
}

export function getShareTitle(item: ShareableItem, mediaType: MediaType) {
  return mediaType === "movie" ? item.title : item.name
}

export function getShareUrl(item: ShareableItem, mediaType: MediaType) {
  return `${getShareBaseUrl()}/${mediaType}/${item.id}`
}

export function getShareCaption(item: ShareableItem, mediaType: MediaType) {
  const title = getShareTitle(item, mediaType)
  const link = getShareUrl(item, mediaType)
  const teaser = trimOverview(item.overview)

  if (teaser) {
    return `${teaser} Watch ${title} on ${SHARE_SITE_NAME}. ${link}`
  }

  return `Watch ${title} on ${SHARE_SITE_NAME}. ${link}`
}

export function getShareImageUrl(item: ShareableItem, origin: string) {
  const preferredPath = item.poster_path || item.backdrop_path

  if (!preferredPath) {
    return `${origin}/placeholder.jpg`
  }

  const params = new URLSearchParams({
    path: preferredPath,
    size: item.poster_path ? "w780" : "w1280",
  })

  return `${origin}/api/share-image?${params.toString()}`
}

export function getShareFileName(item: ShareableItem, mediaType: MediaType, contentType?: string) {
  const baseName = sanitizeFileName(getShareTitle(item, mediaType)) || `${mediaType}-share`

  if (contentType?.includes("png")) return `${baseName}.png`
  if (contentType?.includes("webp")) return `${baseName}.webp`
  if (contentType?.includes("avif")) return `${baseName}.avif`

  return `${baseName}.jpg`
}
