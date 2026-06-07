import { findTransaction } from "@/lib/paypack"
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
      .select("status, paypack_ref, processed_at")
      .eq("paypack_ref", ref)
      .eq("user_id", user.id)
      .maybeSingle<{ status: string; paypack_ref: string; processed_at: string | null }>()

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

    const providerTransaction = await findTransaction(ref)

    if (!providerTransaction?.status || providerTransaction.status === "pending") {
      return NextResponse.json({
        ref,
        status: "pending",
        source: "paypack",
      })
    }

    const result = await applyPaypackTransactionResult({
      ref,
      status: providerTransaction.status,
      amount: providerTransaction.amount,
      kind: providerTransaction.kind,
      client: providerTransaction.client,
      processed_at: providerTransaction.processed_at ?? providerTransaction.timestamp,
      created_at: providerTransaction.created_at ?? providerTransaction.timestamp,
    })

    return NextResponse.json({
      ref,
      status: result.status,
      source: "paypack",
      result,
    })
  } catch (error: any) {
    console.error("[paypack.status_error]", {
      message: error?.message || "Unknown error",
    })

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
