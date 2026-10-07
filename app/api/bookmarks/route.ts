import type { NextRequest } from 'next/server'
import { admin } from '../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const { data, error } = await admin().from('bookmarks').select('word_id').eq('profile_id', session.id)
  if (error) return serverError(error)
  return Response.json({ wordIds: (data ?? []).map(r => r.word_id) })
}

// 북마크 설정/해제 — profile_id는 세션에서만 가져온다
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const body = await request.json().catch(() => null)
  if (typeof body?.wordId !== 'string' || typeof body?.bookmarked !== 'boolean') return badRequest()

  const query = body.bookmarked
    ? admin().from('bookmarks').upsert({ profile_id: session.id, word_id: body.wordId })
    : admin().from('bookmarks').delete().eq('profile_id', session.id).eq('word_id', body.wordId)
  const { error } = await query
  if (error) return serverError(error)
  return Response.json({ ok: true })
}
