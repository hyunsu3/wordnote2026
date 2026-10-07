// 로그인 무차별 대입 방지용 간이 제한 (인스턴스 메모리 기반 — 서버리스에서는 best-effort)
const WINDOW_MS = 10 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

export function isBlocked(key: string, limit: number): boolean {
  const e = attempts.get(key)
  if (!e) return false
  if (e.resetAt < Date.now()) { attempts.delete(key); return false }
  return e.count >= limit
}

export function recordFailure(key: string): void {
  const now = Date.now()
  const e = attempts.get(key)
  if (!e || e.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
  else e.count++
}

export function clearFailures(key: string): void {
  attempts.delete(key)
}
