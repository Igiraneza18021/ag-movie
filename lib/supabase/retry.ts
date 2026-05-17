export function isTransientFetchError(error: unknown) {
  if (!error) return false

  const text = `${String(error)} ${JSON.stringify(error)}`.toLowerCase()
  return (
    text.includes("fetch failed") ||
    text.includes("econnreset") ||
    text.includes("timeout") ||
    text.includes("networkerror")
  )
}

export async function runSupabaseQueryWithRetry<T>(
  query: () => PromiseLike<{ data: T | null; error: unknown }>,
  attempts = 3,
) {
  let result: { data: T | null; error: unknown } | null = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    result = await query()

    if (!result.error || !isTransientFetchError(result.error)) {
      return result
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
    }
  }

  if (result?.error && isTransientFetchError(result.error)) {
    throw result.error
  }

  return result ?? { data: null, error: null }
}
