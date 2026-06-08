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
  const normalizedSelectedId =
    selectedGenreId && Number.isNaN(Number.parseInt(selectedGenreId, 10))
      ? normalizeGenreName(selectedGenreId.replace(/^name:/, ""))
      : ""

  return genres.some((genre) => {
    const tmdbId = toGenreTmdbId(genre)
    const matchesId = parsedGenreId !== null && Number.isFinite(parsedGenreId) && tmdbId === parsedGenreId
    const genreName = normalizeGenreName(getGenreName(genre))
    const matchesName =
      (normalizedName.length > 0 && genreName === normalizedName) ||
      (normalizedSelectedId.length > 0 && genreName === normalizedSelectedId)
    return matchesId || matchesName
  })
}

export function buildGenreOptions(items: Array<{ genres?: Array<ContentGenreLike | string> | null }>) {
  const genresByName = new Map<string, Genre>()

  for (const item of items) {
    const genres = Array.isArray(item.genres) ? item.genres : []

    for (const genre of genres) {
      const tmdbId = toGenreTmdbId(genre)
      const name = getGenreName(genre)
      const normalizedName = normalizeGenreName(name)

      if (!name || !normalizedName) continue

      const existingGenre = genresByName.get(normalizedName)
      const nextGenre: Genre = tmdbId
        ? {
            id: tmdbId.toString(),
            tmdb_id: tmdbId,
            name,
            created_at: "",
          }
        : {
            id: `name:${normalizedName}`,
            tmdb_id: -1,
            name,
            created_at: "",
          }

      if (!existingGenre) {
        genresByName.set(normalizedName, nextGenre)
        continue
      }

      if (existingGenre.tmdb_id === -1 && tmdbId) {
        genresByName.set(normalizedName, nextGenre)
      }
    }
  }

  return Array.from(genresByName.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function findGenreByParams(
  genres: Genre[],
  selectedGenreId?: string | null,
  selectedGenreName?: string | null,
) {
  const parsedGenreId = selectedGenreId ? Number.parseInt(selectedGenreId, 10) : null
  const normalizedName = normalizeGenreName(selectedGenreName)

  return (
    genres.find((genre) => genre.id === selectedGenreId) ||
    genres.find((genre) => parsedGenreId !== null && genre.tmdb_id === parsedGenreId) ||
    genres.find((genre) => normalizeGenreName(genre.name) === normalizedName) ||
    null
  )
}
