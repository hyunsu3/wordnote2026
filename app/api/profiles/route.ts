import { admin } from '../../lib/server/admin'
import { serverError } from '../../lib/server/session'

// 로그인 화면용 프로필 목록 (id, name만 공개 — pin은 절대 반환하지 않음)
export async function GET() {
  const { data, error } = await admin()
    .from('profiles')
    .select('id, name')
    .order('created_at', { ascending: true })
  if (error) return serverError(error)
  return Response.json({ profiles: data ?? [] })
}
