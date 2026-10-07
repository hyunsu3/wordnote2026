import { admin } from '../../lib/server/admin'

// 임시 진단용 — 원인 확인 후 삭제할 것. 키 값은 절대 반환하지 않고 설정 여부만 알려준다.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET_ok: (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  }
  let db: string
  try {
    const { count, error } = await admin().from('profiles').select('id', { count: 'exact', head: true })
    db = error ? `error: ${error.message}` : `ok (profiles: ${count})`
  } catch (e) {
    db = `exception: ${e instanceof Error ? e.message : String(e)}`
  }
  return Response.json({ env, db })
}
