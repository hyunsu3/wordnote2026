import type { NextRequest } from 'next/server'
import { admin } from '../../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../../lib/server/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const b = await request.json().catch(() => null)
  if (typeof b?.wordId !== 'string' || typeof b?.word !== 'string' || typeof b?.meaning !== 'string' || typeof b?.isCorrect !== 'boolean') {
    return badRequest()
  }

  const { data: existing, error: readError } = await admin()
    .from('word_stats')
    .select('id, correct_count, wrong_count')
    .eq('word_id', b.wordId)
    .eq('profile_id', session.id)
    .maybeSingle()
  if (readError) return serverError(readError)

  const now = new Date().toISOString()
  if (existing) {
    const correctCount = (existing.correct_count ?? 0) + (b.isCorrect ? 1 : 0)
    const wrongCount = (existing.wrong_count ?? 0) + (b.isCorrect ? 0 : 1)
    const { error } = await admin()
      .from('word_stats')
      .update({ correct_count: correctCount, wrong_count: wrongCount, last_studied: now })
      .eq('id', existing.id)
    if (error) return serverError(error)
    return Response.json({ stat: { wordId: b.wordId, correctCount, wrongCount, lastStudied: now, tapCount: 0 } })
  }

  const correctCount = b.isCorrect ? 1 : 0
  const wrongCount = b.isCorrect ? 0 : 1
  const { error } = await admin().from('word_stats').insert({
    word_id: b.wordId,
    word: b.word,
    meaning: b.meaning,
    correct_count: correctCount,
    wrong_count: wrongCount,
    last_studied: now,
    profile_id: session.id,
  })
  if (error) return serverError(error)
  return Response.json({ stat: { wordId: b.wordId, correctCount, wrongCount, lastStudied: now, tapCount: 0 } })
}
