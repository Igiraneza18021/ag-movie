import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const TMDB_IMAGE_ORIGIN = "https://image.tmdb.org"
const VALID_SIZES = new Set(["w500", "w780", "w1280", "original"])

function isSafeTmdbPath(path: string) {
  return path.startsWith("/") && !path.includes("..")
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? ""
  const requestedSize = request.nextUrl.searchParams.get("size") ?? "w780"
  const size = VALID_SIZES.has(requestedSize) ? requestedSize : "w780"

  if (!path || !isSafeTmdbPath(path)) {
    return NextResponse.json({ error: "A valid TMDB image path is required." }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${TMDB_IMAGE_ORIGIN}/t/p/${size}${path}`, {
      cache: "force-cache",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: `Image source returned ${upstream.status}.` }, { status: upstream.status })
    }

    const body = await upstream.arrayBuffer()
    const contentType = upstream.headers.get("content-type") || "image/jpeg"
    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=86400"

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": cacheControl,
        "Content-Length": String(body.byteLength),
        "Content-Type": contentType,
      },
    })
  } catch (error) {
    console.error("Failed to fetch share image:", error)
    return NextResponse.json({ error: "Failed to fetch share image." }, { status: 500 })
  }
}
