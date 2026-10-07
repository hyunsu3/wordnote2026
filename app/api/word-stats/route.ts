import { admin } from '../../lib/server/admin'
import { getSession, serverError, unauthorized } from '../../lib/server/session'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const { data, error } = await admin()
    .from('word_stats')
    .select('word_id, correct_count, wrong_count, last_studied, tap_count')
    .eq('profile_id', session.id)
    .not('word_id', 'is', null)
  if (error) return serverError(error)
  const stats = (data ?? []).map(r => ({
    wordId: r.word_id,
    correctCount: r.correct_count ?? 0,
    wrongCount: r.wrong_count ?? 0,
    lastStudied: r.last_studied ?? null,
    tapCount: r.tap_count ?? 0,
  }))
  return Response.json({ stats })
}
