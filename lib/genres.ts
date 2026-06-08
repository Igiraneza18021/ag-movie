import type { Genre } from "@/lib/types"

type ContentGenreLike = {
  id?: string | number | null
  tmdb_id?: number | null
  name?: string | null
}

function getGenreName(genre: ContentGenreLike | string) {
  if (typeof genre === "string") {
    return genre.trim()
  }

  return genre.name?.trim() || ""
}

function toGenreTmdbId(genre: ContentGenreLike | string) {
  if (typeof genre === "string") {
    return null
  }

  if (typeof genre.tmdb_id === "number" && Number.isFinite(genre.tmdb_id)) {
    return genre.tmdb_id
  }

  if (typeof genre.tmdb_id === "string") {
    const parsedTmdbId = Number.parseInt(genre.tmdb_id, 10)
    if (Number.isFinite(parsedTmdbId)) {
      return parsedTmdbId
    }
  }

  if (typeof genre.id === "number" && Number.isFinite(genre.id)) {
    return genre.id
  }

  if (typeof genre.id === "string") {
    const parsedId = Number.parseInt(genre.id, 10)
    if (Number.isFinite(parsedId)) {
      return parsedId
    }
  }

  return null
}

export function normalizeGenreName(name: string | null | undefined) {
  return (name || "").trim().toLowerCase()
}

export function contentHasGenre(
  genres: Array<ContentGenreLike | string> | null | undefined,
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
    const matchesName = normalizedName.length > 0 && normalizeGenreName(getGenreName(genre)) === normalizedName
    return matchesId || matchesName
  })
}

export function buildGenreOptions(items: Array<{ genres?: Array<ContentGenreLike | string> | null }>) {
  const genreMap = new Map<number, Genre>()
  const stringOnlyGenreMap = new Map<string, Genre>()
  const canonicalNames = new Set<string>()

  for (const item of items) {
    const genres = Array.isArray(item.genres) ? item.genres : []

    for (const genre of genres) {
      const tmdbId = toGenreTmdbId(genre)
      const name = getGenreName(genre)

      if (!name) continue

      if (tmdbId) {
        if (genreMap.has(tmdbId)) continue

        genreMap.set(tmdbId, {
          id: tmdbId.toString(),
          tmdb_id: tmdbId,
          name,
          created_at: "",
        })
        canonicalNames.add(normalizeGenreName(name))
        continue
      }

      const normalizedName = normalizeGenreName(name)
      if (canonicalNames.has(normalizedName) || stringOnlyGenreMap.has(normalizedName)) continue

      stringOnlyGenreMap.set(normalizedName, {
        id: normalizedName,
        tmdb_id: -1,
        name,
        created_at: "",
      })
    }
  }

  return [...genreMap.values(), ...stringOnlyGenreMap.values()].sort((a, b) => a.name.localeCompare(b.name))
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
