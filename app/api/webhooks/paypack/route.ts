import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    const signature = request.headers.get("X-Paypack-Signature")
    const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET

    console.log("Paypack Webhook Received:", { 
      kind: body.kind, 
      ref: body.data?.ref, 
      status: body.data?.status 
    })

    // 1. Verify Signature (if secret is configured)
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret)
      const digest = hmac.update(rawBody).digest("base64")
      
      if (digest !== signature) {
        console.error("Paypack Webhook: Invalid Signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const { data: eventData, kind: eventKind } = body

    if (eventKind === "transaction:processed") {
      const { ref, status } = eventData
      
      // IMPORTANT: Use Admin Client to bypass RLS for external webhook
      const supabase = createAdminSupabaseClient({ requireServiceRole: true })

      console.log(`Processing ${status} transaction for ref: ${ref}`)

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
        console.error("Webhook: Transaction update failed:", txError.message)
        return NextResponse.json({ error: "Transaction mapping failed" }, { status: 200 })
      }

      // 2. If successful, create or update subscription
      if (status === "successful" && tx?.user_id) {
        const now = new Date()
        const expiryDate = new Date(now)
        expiryDate.setMonth(now.getMonth() + 1)

        console.log(`Activating subscription for user: ${tx.user_id}`)

        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: tx.user_id,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: expiryDate.toISOString(),
            updated_at: now.toISOString()
          }, { onConflict: "user_id" })

        if (subError) {
          console.error("Webhook: Subscription upsert failed:", subError.message)
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_subscribed: true })
          .eq("id", tx.user_id)
        
        if (profileError) {
          console.error("Webhook: Profile update failed:", profileError.message)
        }
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
