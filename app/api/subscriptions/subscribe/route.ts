import { createClient } from "@/lib/supabase/server"
import { initiateCashin } from "@/lib/paypack"
import { NextResponse } from "next/server"

const SUBSCRIPTION_AMOUNT_RWF = 2000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber } = await request.json()
    
    const amount = SUBSCRIPTION_AMOUNT_RWF

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
    console.error("Subscription flow error:", error)
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 500 })
  }
}
