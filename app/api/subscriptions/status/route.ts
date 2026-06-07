import { findProcessedTransactionEvent } from "@/lib/paypack"
import { applyPaypackTransactionResult } from "@/lib/paypack-subscriptions"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const ref = url.searchParams.get("ref")

    if (!ref) {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 })
    }

    const { data: localTransaction, error: localTransactionError } = await supabase
      .from("paypack_transactions")
      .select("status, paypack_ref, processed_at, kind, client_phone")
      .eq("paypack_ref", ref)
      .eq("user_id", user.id)
      .maybeSingle<{
        status: string
        paypack_ref: string
        processed_at: string | null
        kind: string | null
        client_phone: string | null
      }>()

    if (localTransactionError) {
      return NextResponse.json({ error: localTransactionError.message }, { status: 500 })
    }

    if (!localTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (localTransaction.status !== "pending") {
      return NextResponse.json({
        ref,
        status: localTransaction.status,
        source: "database",
      })
    }

    const processedEvent = await findProcessedTransactionEvent({
      ref,
      kind: localTransaction.kind,
      client: localTransaction.client_phone,
    })

    if (!processedEvent) {
      console.log("[paypack.status_pending]", {
        ref,
        source: "events",
      })

      return NextResponse.json({
        ref,
        status: "pending",
        source: "paypack_events",
        reason: "not_yet_visible_upstream",
      })
    }

    const result = await applyPaypackTransactionResult({
      ref,
      status: processedEvent.data.status ?? "pending",
      amount: processedEvent.data.amount,
      kind: processedEvent.data.kind,
      client: processedEvent.data.client,
      provider: processedEvent.data.provider,
      processed_at: processedEvent.data.processed_at ?? processedEvent.created_at,
      created_at: processedEvent.data.created_at ?? processedEvent.created_at,
    })

    console.log("[paypack.status_reconciled]", {
      ref,
      source: "events",
      eventId: processedEvent.event_id,
      status: result.status,
    })

    return NextResponse.json({
      ref,
      status: result.status,
      source: "paypack_events",
      result,
    })
  } catch (error: any) {
    console.error("[paypack.status_error]", {
      message: error?.message || "Unknown error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
