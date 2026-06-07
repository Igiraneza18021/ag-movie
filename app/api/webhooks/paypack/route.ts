import { applyPaypackTransactionResult } from "@/lib/paypack-subscriptions"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    const signature = request.headers.get("x-paypack-signature") || request.headers.get("X-Paypack-Signature")
    const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET

    if (webhookSecret) {
      if (!signature) {
        console.error("[paypack.webhook_missing_signature]")
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }

      const hmac = crypto.createHmac("sha256", webhookSecret)
      const digest = hmac.update(rawBody).digest("base64")
      const digestBuffer = Buffer.from(digest)
      const signatureBuffer = Buffer.from(signature)

      if (digestBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(digestBuffer, signatureBuffer)) {
        console.error("[paypack.webhook_invalid_signature]")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const eventKind = body.kind || body["event-kind"]
    const eventData = body.data
    const eventId = body.event_id ?? null

    if (eventKind !== "transaction:processed" || !eventData?.ref || !eventData?.status) {
      console.log("[paypack.webhook_ignored]", {
        eventId,
        kind: eventKind ?? null,
      })

      return NextResponse.json({ success: true, ignored: true })
    }

    const result = await applyPaypackTransactionResult({
      ref: eventData.ref,
      status: eventData.status,
      amount: eventData.amount,
      kind: eventData.kind,
      client: eventData.client,
      provider: eventData.provider,
      created_at: eventData.created_at,
      processed_at: eventData.processed_at,
    })

    console.log("[paypack.webhook_processed]", {
      eventId,
      kind: eventKind,
      ref: eventData.ref,
      status: eventData.status,
      result,
    })

    return NextResponse.json({ success: true, result })

  } catch (error: any) {
    console.error("[paypack.webhook_error]", {
      message: error?.message || "Unknown error",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Support Paypack's HEAD ping for webhook validation
export async function HEAD() {
  return new Response(null, { status: 200 })
}
