const ADCASH_URL = "https://adbpage.com/adblock?v=3&format=js"
const CACHE_TTL_SECONDS = Number(process.env.ADCASH_CACHE_TTL_SECONDS || "300")

let cachedSource: string | null = null
let cachedAt = 0

export async function GET() {
  const now = Date.now()
  const ttlMs = CACHE_TTL_SECONDS * 1000

  if (cachedSource && now - cachedAt < ttlMs) {
    return new Response(cachedSource, {
      headers: {
        "Content-Type": "application/javascript; charset=UTF-8",
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(ADCASH_URL, {
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Adcash responded with ${response.status}`)
    }

    const source = await response.text()

    cachedSource = source
    cachedAt = now

    return new Response(source, {
      headers: {
        "Content-Type": "application/javascript; charset=UTF-8",
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    })
  } catch {
    return new Response("/* Adcash library unavailable */", {
      status: 503,
      headers: {
        "Content-Type": "application/javascript; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}
