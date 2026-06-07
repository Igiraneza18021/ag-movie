import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const PROVIDER_ALIAS_HOSTS: Record<string, string[]> = {
  "hgcloud.to": ["hanerix.com"],
  "hglink.to": ["hanerix.com"],
  "cybervynx.com": ["medixiru.com"],
  "medixiru.com": ["cybervynx.com"],
  "dhcplay.com": ["vibuxer.com"],
  "vibuxer.com": ["dhcplay.com"],
}

function decodePossiblyEscaped(value: string) {
  return value
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/")
    .replace(/&amp;/g, "&")
}

function unpackPackerScripts(source: string) {
  const unpacked: string[] = []
  const pattern =
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)\)\)/g

  for (const match of source.matchAll(pattern)) {
    let payload = match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\")
    const radix = Number(match[2])
    const count = Number(match[3])
    const dictionary = match[4].split("|")

    for (let index = count - 1; index >= 0; index -= 1) {
      const replacement = dictionary[index]

      if (replacement) {
        payload = payload.replace(new RegExp(`\\b${index.toString(radix)}\\b`, "g"), replacement)
      }
    }

    unpacked.push(payload)
  }

  return unpacked.join("\n")
}

function isBlockedUrl(value: string) {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()

    return (
      !["http:", "https:"].includes(url.protocol) ||
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
      hostname.startsWith("169.254.")
    )
  } catch {
    return true
  }
}

function findHlsUrl(source: string, baseUrl: string) {
  const decodedSource = decodePossiblyEscaped(source)
  const searchableSource = `${decodedSource}\n${unpackPackerScripts(decodedSource)}`
  const candidates = [
    ...searchableSource.matchAll(/\b(https?:\/\/[^\s"'<>\\]+?\.m3u8(?:\?[^\s"'<>\\]*)?)/gi),
    ...searchableSource.matchAll(/["']([^"']+?\.m3u8(?:\?[^"']*)?)["']/gi),
  ]
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const value = decodePossiblyEscaped(candidate[1])

    try {
      const hlsUrl = new URL(value, baseUrl).toString()

      if (!seen.has(hlsUrl) && !isBlockedUrl(hlsUrl)) {
        seen.add(hlsUrl)
        return hlsUrl
      }
    } catch {
      continue
    }
  }

  return null
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(decodePossiblyEscaped(value), baseUrl).toString()
  } catch {
    return null
  }
}

function extractEmbedRedirectUrls(source: string, baseUrl: string) {
  const decodedSource = decodePossiblyEscaped(source)
  const searchableSource = `${decodedSource}\n${unpackPackerScripts(decodedSource)}`
  const patterns = [
    /window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/gi,
    /location\.href\s*=\s*["']([^"']+)["']/gi,
    /location\.replace\(\s*["']([^"']+)["']\s*\)/gi,
    /location\.assign\(\s*["']([^"']+)["']\s*\)/gi,
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'>\s]+)[^"']*["']/gi,
  ]
  const redirects: string[] = []
  const seen = new Set<string>()

  for (const pattern of patterns) {
    for (const match of searchableSource.matchAll(pattern)) {
      const redirectUrl = toAbsoluteUrl(match[1], baseUrl)
      if (!redirectUrl || seen.has(redirectUrl) || isBlockedUrl(redirectUrl)) continue
      seen.add(redirectUrl)
      redirects.push(redirectUrl)
    }
  }

  return redirects
}

function isLoadingShellPage(source: string) {
  const decodedSource = decodePossiblyEscaped(source)
  return /<title>\s*loading\.\.\.\s*<\/title>/i.test(decodedSource)
    || /page is loading,\s*please wait/i.test(decodedSource)
}

function getFallbackEmbedUrls(embedUrl: string) {
  const url = new URL(embedUrl)
  const hostnames = PROVIDER_ALIAS_HOSTS[url.hostname.toLowerCase()] ?? []

  return hostnames.map((hostname) => `https://${hostname}${url.pathname}${url.search}`)
}

function getResolveAttempts(embedUrl: string) {
  const seen = new Set<string>()
  const attempts = [embedUrl, ...getFallbackEmbedUrls(embedUrl)].filter((value) => {
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })

  return attempts
}

async function fetchEmbedPage(embedUrl: string) {
  const upstream = new URL(embedUrl)
  const response = await fetch(embedUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: `${upstream.origin}/`,
    },
    cache: "no-store",
  })

  return {
    response,
    finalUrl: response.url || embedUrl,
    html: response.ok ? await response.text() : "",
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const embedUrl = typeof body?.embedUrl === "string" ? body.embedUrl.trim() : ""

    if (!embedUrl || isBlockedUrl(embedUrl)) {
      return NextResponse.json({ error: "A valid public embed URL is required." }, { status: 400 })
    }

    if (/\.m3u8(?:\?|$)/i.test(embedUrl)) {
      return NextResponse.json({ hlsUrl: embedUrl, referer: embedUrl })
    }

    const attempts = [...getResolveAttempts(embedUrl)]
    const attemptedUrls = new Set<string>()
    let lastStatus = 500

    for (let index = 0; index < attempts.length; index += 1) {
      const attemptUrl = attempts[index]
      if (isBlockedUrl(attemptUrl)) continue
      if (attemptedUrls.has(attemptUrl)) continue
      attemptedUrls.add(attemptUrl)

      let result: Awaited<ReturnType<typeof fetchEmbedPage>>

      try {
        result = await fetchEmbedPage(attemptUrl)
      } catch (attemptError) {
        console.warn("HLS resolve attempt failed:", attemptUrl, attemptError)
        lastStatus = 504
        continue
      }

      const { response, finalUrl, html } = result
      lastStatus = response.status

      if (!response.ok) continue

      const hlsUrl = findHlsUrl(html, finalUrl)

      if (hlsUrl) {
        return NextResponse.json({ hlsUrl, referer: finalUrl })
      }

      const redirectAttempts = extractEmbedRedirectUrls(html, finalUrl)
      const aliasAttempts = getFallbackEmbedUrls(finalUrl)
      const queuedAttempts = isLoadingShellPage(html)
        ? [...aliasAttempts, ...redirectAttempts]
        : [...redirectAttempts, ...aliasAttempts]

      for (const nextAttempt of queuedAttempts) {
        if (attemptedUrls.has(nextAttempt) || attempts.includes(nextAttempt) || isBlockedUrl(nextAttempt)) continue
        attempts.push(nextAttempt)
      }
    }

    if (lastStatus >= 400) {
      return NextResponse.json(
        { error: `Embed page returned ${lastStatus}.` },
        { status: lastStatus },
      )
    }

    return NextResponse.json({ error: "No HLS stream was found in the embed page." }, { status: 404 })
  } catch (error) {
    console.error("Failed to resolve HLS stream:", error)
    return NextResponse.json({ error: "Failed to resolve HLS stream." }, { status: 500 })
  }
}
