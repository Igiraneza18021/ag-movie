import type { Genre } from "@/lib/types"

type ContentGenreLike = {
  id?: string | number | null
  tmdb_id?: number | null
  name?: string | null
}

function toGenreTmdbId(genre: ContentGenreLike) {
  if (typeof genre.tmdb_id === "number" && Number.isFinite(genre.tmdb_id)) {
    return genre.tmdb_id
  }

  if (typeof genre.id === "number" && Number.isFinite(genre.id)) {
    return genre.id
  }

  return null
}

export function normalizeGenreName(name: string | null | undefined) {
  return (name || "").trim().toLowerCase()
}

export function contentHasGenre(
  genres: ContentGenreLike[] | null | undefined,
  selectedGenreId?: string | null,
  selectedGenreName?: string | null,
) {
  if (!Array.isArray(genres) || (!selectedGenreId && !selectedGenreName)) {
    return !selectedGenreId && !selectedGenreName
  }

  const normalizedName = normalizeGenreName(selectedGenreName)
  const parsedGenreId = selectedGenreId ? Number.parseInt(selectedGenreId, 10) : null

  return genres.some((genre) => {
    const tmdbId = toGenreTmdbId(genre)
    const matchesId = parsedGenreId !== null && Number.isFinite(parsedGenreId) && tmdbId === parsedGenreId
    const matchesName = normalizedName.length > 0 && normalizeGenreName(genre.name) === normalizedName
    return matchesId || matchesName
  })
}

export function buildGenreOptions(items: Array<{ genres?: ContentGenreLike[] | null }>) {
  const genreMap = new Map<number, Genre>()

  for (const item of items) {
    const genres = Array.isArray(item.genres) ? item.genres : []

    for (const genre of genres) {
      const tmdbId = toGenreTmdbId(genre)
      const name = genre.name?.trim()

      if (!tmdbId || !name || genreMap.has(tmdbId)) continue

      genreMap.set(tmdbId, {
        id: tmdbId.toString(),
        tmdb_id: tmdbId,
        name,
        created_at: "",
      })
    }
  }

  return Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function findGenreByParams(
  genres: Genre[],
  selectedGenreId?: string | null,
  selectedGenreName?: string | null,
) {
  const parsedGenreId = selectedGenreId ? Number.parseInt(selectedGenreId, 10) : null
  const normalizedName = normalizeGenreName(selectedGenreName)

  return (
    genres.find((genre) => parsedGenreId !== null && genre.tmdb_id === parsedGenreId) ||
    genres.find((genre) => normalizeGenreName(genre.name) === normalizedName) ||
    null
  )
}
