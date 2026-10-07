import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 서버 전용: service_role 키는 RLS를 우회하므로 절대 NEXT_PUBLIC_ 로 노출하지 말 것.
let client: SupabaseClient | null = null

export function admin(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set')
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
