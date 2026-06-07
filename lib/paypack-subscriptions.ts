import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isSubscriptionActive } from "@/lib/subscription-access"

type PaypackTerminalStatus = "successful" | "failed"

interface ApplyPaypackTransactionInput {
  ref: string
  status: string
  amount?: number
  kind?: string
  client?: string
  provider?: string
  created_at?: string
  processed_at?: string
}

interface ExistingSubscription {
  status: string
  current_period_end: string
}

function normalizePaypackStatus(status?: string): PaypackTerminalStatus | "pending" | null {
  if (status === "successful" || status === "failed" || status === "pending") {
    return status
  }

  return null
}

function addCalendarMonth(date: Date) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + 1)
  return next
}

async function syncProfileSubscriptionCache(userId: string, supabase = createAdminSupabaseClient({ requireServiceRole: true })) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<ExistingSubscription>()

  const isSubscribed = isSubscriptionActive(subscription ?? null)

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_subscribed: isSubscribed })
    .eq("id", userId)

  if (profileError) {
    console.error("[paypack.subscription_cache_failed]", { userId, message: profileError.message })
  }
}

export async function applyPaypackTransactionResult(input: ApplyPaypackTransactionInput) {
  const normalizedStatus = normalizePaypackStatus(input.status)

  if (!normalizedStatus || normalizedStatus === "pending") {
    return {
      ok: false as const,
      reason: "unsupported_status",
      status: input.status ?? null,
    }
  }

  const supabase = createAdminSupabaseClient({ requireServiceRole: true })
  const processedAt = input.processed_at ?? new Date().toISOString()
  const transactionUpdate: Record<string, unknown> = {
    status: normalizedStatus,
    processed_at: processedAt,
  }

  if (typeof input.amount === "number") {
    transactionUpdate.amount = input.amount
  }

  if (input.client) {
    transactionUpdate.client_phone = input.client
  }

  if (input.kind) {
    transactionUpdate.kind = input.kind
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("paypack_transactions")
    .update(transactionUpdate)
    .eq("paypack_ref", input.ref)
    .select("user_id")
    .maybeSingle<{ user_id: string | null }>()

  if (transactionError) {
    console.error("[paypack.transaction_update_failed]", {
      ref: input.ref,
      status: normalizedStatus,
      message: transactionError.message,
    })

    return {
      ok: false as const,
      reason: "transaction_update_failed",
      status: normalizedStatus,
    }
  }

  if (!transaction) {
    return {
      ok: false as const,
      reason: "transaction_not_found",
      status: normalizedStatus,
    }
  }

  if (!transaction.user_id) {
    return {
      ok: true as const,
      status: normalizedStatus,
      subscriptionActive: false,
    }
  }

  if (normalizedStatus === "failed") {
    await syncProfileSubscriptionCache(transaction.user_id, supabase)

    return {
      ok: true as const,
      status: normalizedStatus,
      subscriptionActive: false,
      userId: transaction.user_id,
    }
  }

  const now = new Date(processedAt)
  const { data: existingSubscription, error: subscriptionLookupError } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", transaction.user_id)
    .maybeSingle<ExistingSubscription>()

  if (subscriptionLookupError) {
    console.error("[paypack.subscription_lookup_failed]", {
      ref: input.ref,
      userId: transaction.user_id,
      message: subscriptionLookupError.message,
    })
  }

  const existingEnd = existingSubscription?.current_period_end ? new Date(existingSubscription.current_period_end) : null
  const startsFromExisting = existingSubscription && isSubscriptionActive(existingSubscription, now) && existingEnd
  const periodStart = startsFromExisting ? existingEnd! : now
  const periodEnd = addCalendarMonth(periodStart)

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: transaction.user_id,
        status: "active",
        plan_id: "premium_ad_free",
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    )

  if (subscriptionError) {
    console.error("[paypack.subscription_upsert_failed]", {
      ref: input.ref,
      userId: transaction.user_id,
      message: subscriptionError.message,
    })

    return {
      ok: false as const,
      reason: "subscription_upsert_failed",
      status: normalizedStatus,
    }
  }

  await syncProfileSubscriptionCache(transaction.user_id, supabase)

  return {
    ok: true as const,
    status: normalizedStatus,
    subscriptionActive: true,
    userId: transaction.user_id,
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
  }
}
