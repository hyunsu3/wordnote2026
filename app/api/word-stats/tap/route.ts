import type { NextRequest } from 'next/server'
import { admin } from '../../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../../lib/server/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const b = await request.json().catch(() => null)
  if (typeof b?.wordId !== 'string' || typeof b?.word !== 'string' || typeof b?.meaning !== 'string') return badRequest()

  // 중복 행이 있어도 실패하지 않도록 첫 행만 사용
  const { data: found, error: readError } = await admin()
    .from('word_stats')
    .select('id, tap_count')
    .eq('word_id', b.wordId)
    .eq('profile_id', session.id)
    .order('id', { ascending: true })
    .limit(1)
  if (readError) return serverError(readError)
  const existing = found?.[0]

  const now = new Date().toISOString()
  if (existing) {
    const tapCount = (existing.tap_count ?? 0) + 1
    const { error } = await admin().from('word_stats').update({ tap_count: tapCount, last_studied: now }).eq('id', existing.id)
    if (error) return serverError(error)
    return Response.json({ tapCount, lastStudied: now })
  }

  const { error } = await admin().from('word_stats').insert({
    word_id: b.wordId,
    word: b.word,
    meaning: b.meaning,
    correct_count: 0,
    wrong_count: 0,
    tap_count: 1,
    last_studied: now,
    profile_id: session.id,
  })
  if (error) return serverError(error)
  return Response.json({ tapCount: 1, lastStudied: now })
}
