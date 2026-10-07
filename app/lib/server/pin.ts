import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const PREFIX = 'scrypt$'

export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX)
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, 32)
  return `${PREFIX}${salt.toString('base64')}$${hash.toString('base64')}`
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// 기존 평문 PIN과 해시 PIN을 모두 지원 (로그인 성공 시 평문은 해시로 업그레이드)
export function verifyPin(pin: string, stored: string): boolean {
  if (!isHashed(stored)) return safeEqual(pin, stored)
  const [, saltB64, hashB64] = stored.split('$')
  if (!saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(pin, Buffer.from(saltB64, 'base64'), expected.length)
  return timingSafeEqual(expected, actual)
}
