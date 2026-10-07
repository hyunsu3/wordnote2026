import type { NextRequest } from 'next/server'
import { admin } from '../../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../../lib/server/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  const b = await request.json().catch(() => null)
  const ids = b?.wordIds
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 5000 || ids.some(i => typeof i !== 'string')) return badRequest()
  const { error } = await admin().from('word_stats').delete().eq('profile_id', session.id).in('word_id', ids)
  if (error) return serverError(error)
  return Response.json({ ok: true })
}
