import type { NextRequest } from 'next/server'
import { admin } from '../../lib/server/admin'
import { clearSession, createSession, getSession, badRequest, serverError } from '../../lib/server/session'
import { hashPin, isHashed, safeEqual, verifyPin } from '../../lib/server/pin'
import { clearFailures, isBlocked, recordFailure } from '../../lib/server/throttle'

// 현재 세션 조회
export async function GET() {
  return Response.json({ profile: await getSession() })
}

// 로그인
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const name = body?.name
    const pin = body?.pin
    if (typeof name !== 'string' || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) return badRequest()

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const keys = [`name:${name}`, `ip:${ip}`]
    if (isBlocked(keys[0], 10) || isBlocked(keys[1], 20)) {
      return Response.json({ error: 'too many attempts' }, { status: 429 })
    }

    const { data: row, error } = await admin()
      .from('profiles')
      .select('id, name, pin')
      .eq('name', name)
      .maybeSingle()
    if (error) return serverError(error)

    const master = process.env.MASTER_PIN
    // pin 컬럼이 숫자형이어도 동작하도록 문자열로 정규화 (앞자리 0 복원)
    const stored = row?.pin == null ? '' : typeof row.pin === 'number' ? String(row.pin).padStart(6, '0') : String(row.pin)
    const ok = !!row && ((!!master && safeEqual(pin, master)) || (stored !== '' && verifyPin(pin, stored)))
    if (!ok || !row) {
      keys.forEach(recordFailure)
      return Response.json({ error: 'invalid credentials' }, { status: 401 })
    }
    keys.forEach(clearFailures)

    // 평문 PIN → 해시 업그레이드는 되돌릴 수 없으므로 명시적으로 켠 경우에만 수행 (PIN_HASH_UPGRADE=1)
    // 전제: profiles.pin 이 text 타입이고 백업을 마친 상태
    if (process.env.PIN_HASH_UPGRADE === '1' && typeof row.pin === 'string' && !isHashed(row.pin) && safeEqual(pin, row.pin)) {
      await admin().from('profiles').update({ pin: hashPin(pin) }).eq('id', row.id)
    }

    const profile = { id: row.id as string, name: row.name as string }
    await createSession(profile)
    return Response.json({ profile })
  } catch (e) {
    return serverError(e)
  }
}

// 로그아웃
export async function DELETE() {
  await clearSession()
  return Response.json({ ok: true })
}
