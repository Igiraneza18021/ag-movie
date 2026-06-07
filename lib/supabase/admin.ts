import { createClient } from "@supabase/supabase-js"

export function createAdminSupabaseClient(options = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const requireServiceRole = options.requireServiceRole ?? false

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.")
  }

  const key = serviceRoleKey || anonKey
  if (!key) {
    throw new Error("Supabase credentials are missing.")
  }

  if (requireServiceRole && !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation.")
  }

  return createClient(url, requireServiceRole ? serviceRoleKey : key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
