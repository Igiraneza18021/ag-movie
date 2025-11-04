const TMDB_TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN
const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export async function searchTMDBMovie(query: string) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': TMDB_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to search TMDB")
  }

  return response.json()
}

export async function getTMDBMovie(id: number) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(`${TMDB_BASE_URL}/movie/${id}`, {
    headers: {
      'Authorization': TMDB_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch movie from TMDB")
  }

  return response.json()
}

export async function searchTMDBTVShow(query: string) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(`${TMDB_BASE_URL}/search/tv?query=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': TMDB_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error("Failed to search TMDB")
  }

  return response.json()
}

export async function getTMDBTVShow(id: number) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(`${TMDB_BASE_URL}/tv/${id}`, {
    headers: {
      'Authorization': TMDB_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch TV show from TMDB")
  }

  return response.json()
}

export async function getTMDBTVSeasons(id: number) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(`${TMDB_BASE_URL}/tv/${id}`, {
    headers: {
      'Authorization': TMDB_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch TV show seasons from TMDB")
  }

  const data = await response.json()
  return data.seasons || []
}

export async function getTMDBSeason(tvId: number, seasonNumber: number) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}`, {
    headers: {
      'Authorization': TMDB_TOKEN,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch season from TMDB")
  }

  return response.json()
}

export function getTMDBImageUrl(path: string, size = "w500") {
  if (!path) return "/placeholder.svg?height=750&width=500"
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export async function searchTMDBSearchMulti(query: string, page = 1) {
  if (!TMDB_TOKEN) {
    throw new Error("TMDB token not configured")
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    {
      headers: {
        'Authorization': TMDB_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to search TMDB")
  }

  return response.json()
}
