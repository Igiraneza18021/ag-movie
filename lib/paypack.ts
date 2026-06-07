const PAYPACK_BASE_URL = "https://payments.paypack.rw/api"

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
    const error = await response.json()
    throw new Error(error.message || "Failed to authorize with Paypack")
  }

  const data = await response.json()
  return data.access
}

export async function initiateCashin(amount: number, phoneNumber: string) {
  const token = await getPaypackAccessToken()

  const response = await fetch(`${PAYPACK_BASE_URL}/transactions/cashin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      number: phoneNumber,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to initiate Cashin")
  }

  return response.json()
}

export async function findTransaction(ref: string) {
  const token = await getPaypackAccessToken()

  const response = await fetch(`${PAYPACK_BASE_URL}/transactions/find/${ref}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}
