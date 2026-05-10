import { NextResponse } from "next/server"
import { notifyMakeMovieCreated, type MovieWebhookPayload } from "@/lib/make-webhook"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MovieWebhookPayload

    if (!body || typeof body.title !== "string" || typeof body.embed_url !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    await notifyMakeMovieCreated(body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
