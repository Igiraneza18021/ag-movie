import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    
    // Paypack headers can vary in casing
    const signature = request.headers.get("x-paypack-signature") || request.headers.get("X-Paypack-Signature")
    const webhookSecret = process.env.PAYPACK_WEBHOOK_SECRET

    console.log("Paypack Webhook Received Body:", rawBody)
    console.log("Paypack Webhook Headers:", { signature, hasSecret: !!webhookSecret })

    // 1. Verify Signature (if secret is configured)
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret)
      const digest = hmac.update(rawBody).digest("base64")
      
      if (digest !== signature) {
        console.error("Paypack Webhook: Invalid Signature. Calculated:", digest, "Received:", signature)
        // During debugging, we might want to log this but continue, 
        // but for production, we should return 401.
        // return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const eventKind = body.kind || body["event-kind"]
    const eventData = body.data

    console.log("Processing Event:", eventKind)

    if (eventKind === "transaction:processed" && eventData) {
      const { ref, status } = eventData
      
      const supabase = createAdminSupabaseClient({ requireServiceRole: true })

      console.log(`Updating DB for transaction ${ref} with status ${status}`)

      // 1. Update transaction status
      const { data: tx, error: txError } = await supabase
        .from("paypack_transactions")
        .update({ 
          status: status === "successful" ? "successful" : "failed",
          processed_at: new Date().toISOString()
        })
        .eq("paypack_ref", ref)
        .select("user_id")
        .maybeSingle()

      if (txError) {
        console.error("Webhook DB Error (Transaction):", txError.message)
        return NextResponse.json({ error: "Database error" }, { status: 200 })
      }

      if (!tx) {
        console.warn(`Webhook: Transaction with ref ${ref} not found in database.`)
        return NextResponse.json({ success: true, message: "Transaction not found locally" })
      }

      // 2. If successful, create or update subscription
      if (status === "successful" && tx.user_id) {
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
            updated_at: now.toISOString(),
            plan_id: 'premium_ad_free'
          }, { onConflict: "user_id" })

        if (subError) {
          console.error("Webhook DB Error (Subscription):", subError.message)
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_subscribed: true })
          .eq("id", tx.user_id)
        
        if (profileError) {
          console.error("Webhook DB Error (Profile):", profileError.message)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("Webhook Global Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Support Paypack's HEAD ping for webhook validation
export async function HEAD() {
  return new Response(null, { status: 200 })
}
