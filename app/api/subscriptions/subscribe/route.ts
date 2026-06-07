import { createClient } from "@/lib/supabase/server"
import { initiateCashin } from "@/lib/paypack"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber } = await request.json()
    
    const isDevMode = process.env.DEV_MODE === "true" || process.env.NEXT_PUBLIC_DEV_MODE === "true"
    const amount = isDevMode ? 100 : 2000

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // 1. Initiate Paypack Cashin
    const paypackResponse = await initiateCashin(amount, phoneNumber)

    // 2. Log transaction in database
    const { error: dbError } = await supabase
      .from("paypack_transactions")
      .insert({
        user_id: user.id,
        paypack_ref: paypackResponse.ref,
        amount,
        client_phone: phoneNumber,
        status: "pending",
        kind: "CASHIN"
      })

    if (dbError) {
      console.error("Database error logging transaction:", dbError)
      // We don't return error here because the payment was already initiated at Paypack
    }

    return NextResponse.json({
      success: true,
      ref: paypackResponse.ref,
      status: paypackResponse.status
    })

  } catch (error: any) {
    console.error("Subscription error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
