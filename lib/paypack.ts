import crypto from "crypto"

const PAYPACK_BASE_URL = "https://payments.paypack.rw/api"

export type PaypackWebhookMode = "development" | "production"

export interface PaypackTransactionResult {
  ref: string
  amount?: number
  kind?: string
  status?: string
  client?: string
  provider?: string
  created_at?: string
  processed_at?: string
  fee?: number
  merchant?: string
  timestamp?: string
}

export interface PaypackTransactionEventData {
  ref: string
  kind?: string
  amount?: number
  client?: string
  provider?: string
  status?: string
  created_at?: string
  processed_at?: string
  merchant?: string
  metadata?: Record<string, unknown> | null
}

export interface PaypackTransactionEvent {
  event_id: string
  event_kind: string
  created_at: string
  data: PaypackTransactionEventData
}

interface PaypackTransactionEventsResponse {
  transactions?: PaypackTransactionEvent[]
}

export function getPaypackWebhookMode(): PaypackWebhookMode {
  const isDevMode = process.env.DEV_MODE === "true" || process.env.NEXT_PUBLIC_DEV_MODE === "true"
  return isDevMode ? "development" : "production"
}

export async function getPaypackAccessToken() {
  const clientId = process.env.PAYPACK_APPLICATION_ID
  const clientSecret = process.env.PAYPACK_APPLICATION_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Paypack credentials not configured")
  }

  const response = await fetch(`${PAYPACK_BASE_URL}/auth/agents/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
    next: { revalidate: 600 } // Cache for 10 minutes (expires in 15)
  })

  if (!response.ok) {
    let errorMessage = "Failed to authorize with Paypack"
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.description || errorMessage
      console.error("Paypack Auth Error:", { status: response.status, errorData })
    } catch (e) {
      console.error("Paypack Auth Error (non-JSON):", { status: response.status })
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.access
}

export async function initiateCashin(amount: number, phoneNumber: string) {
  const token = await getPaypackAccessToken()
  const webhookMode = getPaypackWebhookMode()
  const idempotencyKey = crypto.randomUUID().replace(/-/g, "").slice(0, 32)

  const response = await fetch(`${PAYPACK_BASE_URL}/transactions/cashin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Webhook-Mode": webhookMode,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      amount,
      number: phoneNumber,
    }),
  })

  if (!response.ok) {
    let errorMessage = "Failed to initiate Cashin"
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.description || errorMessage
      console.error("Paypack Cashin Error:", { status: response.status, errorData })
    } catch (e) {
      console.error("Paypack Cashin Error (non-JSON):", { status: response.status })
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function findTransaction(ref: string) {
  const token = await getPaypackAccessToken()
  const webhookMode = getPaypackWebhookMode()

  const response = await fetch(`${PAYPACK_BASE_URL}/transactions/find/${ref}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-Webhook-Mode": webhookMode,
    },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

export async function findProcessedTransactionEvent(input: {
  ref: string
  kind?: string | null
  client?: string | null
}) {
  const token = await getPaypackAccessToken()
  const params = new URLSearchParams({ ref: input.ref })

  if (input.kind) {
    params.set("kind", input.kind)
  }

  if (input.client) {
    params.set("client", input.client)
  }

  const response = await fetch(`${PAYPACK_BASE_URL}/events/transactions?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    console.error("[paypack.events_lookup_failed]", {
      ref: input.ref,
      status: response.status,
    })
    return null
  }

  const payload = (await response.json()) as PaypackTransactionEventsResponse
  const transactions = payload.transactions ?? []

  const processedEvents = transactions
    .filter((transaction) => transaction.event_kind === "transaction:processed" && transaction.data?.status)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return processedEvents[0] ?? null
}
