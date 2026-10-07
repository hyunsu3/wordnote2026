import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import type { Profile } from '../api'

const COOKIE = 'drvoca_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET (32+ chars) is not set')
  return s
}

function sign(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url')
}

export async function createSession(profile: Profile): Promise<void> {
  const body = Buffer.from(JSON.stringify({ id: profile.id, name: profile.name, exp: Date.now() + MAX_AGE_SECONDS * 1000 })).toString('base64url')
  const store = await cookies()
  store.set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getSession(): Promise<Profile | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  const [body, sig] = raw.split('.')
  if (!body || !sig) return null
  const expected = Buffer.from(sign(body))
  const actual = Buffer.from(sig)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (typeof data.id !== 'string' || typeof data.name !== 'string' || typeof data.exp !== 'number') return null
    if (data.exp < Date.now()) return null
    return { id: data.id, name: data.name }
  } catch {
    return null
  }
}

export function unauthorized(): Response {
  return Response.json({ error: 'unauthorized' }, { status: 401 })
}

export function badRequest(message = 'bad request'): Response {
  return Response.json({ error: message }, { status: 400 })
}

export function serverError(error: unknown): Response {
  console.error(error)
  // 개발 환경에서만 원인을 응답에 포함 (배포 환경에서는 숨김)
  const detail = process.env.NODE_ENV !== 'production' ? error : undefined
  return Response.json({ error: 'server error', detail }, { status: 500 })
}
