import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const signature = request.headers.get("X-Paypack-Signature")
    const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET

    // 1. Verify Signature (if secret is configured)
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret)
      const digest = hmac.update(JSON.stringify(body)).digest("base64")
      
      if (digest !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const { data: eventData, kind: eventKind } = body

    if (eventKind === "transaction:processed") {
      const { ref, status, amount, client } = eventData
      const supabase = await createClient()

      // 1. Update transaction status
      const { data: tx, error: txError } = await supabase
        .from("paypack_transactions")
        .update({ 
          status: status === "successful" ? "successful" : "failed",
          processed_at: new Date().toISOString()
        })
        .eq("paypack_ref", ref)
        .select("user_id")
        .single()

      if (txError) {
        console.error("Webhook: Failed to update transaction:", txError)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      // 2. If successful, create or update subscription
      if (status === "successful" && tx?.user_id) {
        const now = new Date()
        const expiryDate = new Date(now)
        expiryDate.setMonth(now.getMonth() + 1) // 1 month subscription

        // Upsert subscription
        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: tx.user_id,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: expiryDate.toISOString(),
            updated_at: now.toISOString()
          }, { onConflict: "user_id" }) // Ensure one active subscription record per user

        if (subError) {
          console.error("Webhook: Failed to update subscription:", subError)
        }

        // Also update profile status for convenience
        await supabase
          .from("profiles")
          .update({ is_subscribed: true })
          .eq("id", tx.user_id)
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Support Paypack's HEAD ping for webhook validation
export async function HEAD() {
  return new Response(null, { status: 200 })
}
