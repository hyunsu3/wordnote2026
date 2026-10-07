import type { NextRequest } from 'next/server'
import { admin } from '../../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../../lib/server/session'

export async function POST(request: NextRequest) {
  if (!(await getSession())) return unauthorized()
  const body = await request.json().catch(() => null)
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 5000 || ids.some(i => typeof i !== 'string') || typeof body?.archived !== 'boolean') {
    return badRequest()
  }
  const { error } = await admin().from('vocabulary').update({ archived: body.archived }).in('id', ids)
  if (error) return serverError(error)
  return Response.json({ ok: true })
}
