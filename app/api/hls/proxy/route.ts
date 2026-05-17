import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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

function proxiedUrl(url: string, referer: string) {
  const params = new URLSearchParams({ url })

  if (referer) {
    params.set("referer", referer)
  }

  return `/api/hls/proxy?${params.toString()}`
}

function rewriteUriAttributes(line: string, sourceUrl: string, referer: string) {
  return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
    const absoluteUrl = new URL(uri, sourceUrl).toString()
    return `URI="${proxiedUrl(absoluteUrl, referer)}"`
  })
}

function rewritePlaylist(playlist: string, sourceUrl: string, referer: string) {
  return playlist
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()

      if (!trimmed) return line
      if (trimmed.startsWith("#")) {
        return rewriteUriAttributes(line, sourceUrl, referer)
      }

      const absoluteUrl = new URL(trimmed, sourceUrl).toString()
      return proxiedUrl(absoluteUrl, referer)
    })
    .join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const sourceUrl = request.nextUrl.searchParams.get("url") ?? ""
    const referer = request.nextUrl.searchParams.get("referer") ?? sourceUrl

    if (!sourceUrl || isBlockedUrl(sourceUrl)) {
      return NextResponse.json({ error: "A valid public HLS URL is required." }, { status: 400 })
    }

    const source = new URL(sourceUrl)
    const headers: HeadersInit = {
      Accept: "*/*",
      Origin: source.origin,
      Referer: referer || source.origin,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    }

    const sourceLooksLikePlaylist = /\.m3u8$/i.test(source.pathname)
    const range = request.headers.get("range")
    if (range && !sourceLooksLikePlaylist) {
      headers.Range = range
    }

    const upstream = await fetch(sourceUrl, {
      headers,
      cache: "no-store",
    })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `HLS source returned ${upstream.status}.` },
        { status: upstream.status },
      )
    }

    const contentType = upstream.headers.get("content-type") ?? ""
    const isPlaylist = contentType.includes("mpegurl") || /\.m3u8(?:\?|$)/i.test(source.pathname)

    if (isPlaylist) {
      const playlist = await upstream.text()
      return new NextResponse(rewritePlaylist(playlist, sourceUrl, referer), {
        status: upstream.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        },
      })
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Accept-Ranges": upstream.headers.get("accept-ranges") ?? "bytes",
        "Cache-Control": "no-store",
        "Content-Length": upstream.headers.get("content-length") ?? "",
        "Content-Range": upstream.headers.get("content-range") ?? "",
        "Content-Type": contentType || "application/octet-stream",
      },
    })
  } catch (error) {
    console.error("Failed to proxy HLS request:", error)
    return NextResponse.json({ error: "Failed to proxy HLS request." }, { status: 500 })
  }
}
