const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500"

export type MovieWebhookPayload = {
  title: string
  description: string
  genres: string
  release_date: string
  rating: number
  poster_url: string | null
  embed_url: string
  download_url: string | null
  narrator: string | null
}

export function buildPosterUrl(poster_path: string | null | undefined): string | null {
  if (!poster_path?.trim()) return null
  return `${TMDB_POSTER_BASE}${poster_path}`
}

type MovieWebhookInput = {
  title: string
  overview?: string | null
  genres?: { name: string }[] | null
  release_date?: string | null
  vote_average?: number | null
  poster_path?: string | null
  embed_url: string
  download_url?: string | null
  narrator?: string | null
}

export function buildMovieWebhookPayload(input: MovieWebhookInput): MovieWebhookPayload {
  return {
    title: input.title,
    description: input.overview ?? "",
    genres:
      input.genres?.length ? input.genres.map((g) => g.name).filter(Boolean).join(", ") : "",
    release_date: input.release_date?.slice(0, 10) ?? "",
    rating: input.vote_average ?? 0,
    poster_url: buildPosterUrl(input.poster_path),
    embed_url: input.embed_url,
    download_url: input.download_url ?? null,
    narrator: input.narrator ?? null,
  }
}

export async function notifyMakeMovieCreated(payload: MovieWebhookPayload): Promise<void> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn("[make-webhook] MAKE_WEBHOOK_URL is not set")
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn("[make-webhook] Bad status", res.status, text.slice(0, 200))
    }
  } catch (err) {
    console.warn("[make-webhook] Request failed:", err)
  }
}
