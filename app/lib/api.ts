// 브라우저 → Next.js API 라우트 호출 래퍼.
// DB(Supabase)는 서버(service_role)에서만 접근하며, 프로필은 서버의 세션 쿠키로 식별한다.

async function call<T>(url: string, method = 'GET', body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      console.error(`${method} ${url} → ${res.status}`, body?.detail ?? '')
      return null
    }
    return (await res.json()) as T
  } catch (e) {
    console.error(e)
    return null
  }
}

// ── auth / profiles ─────────────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
}

export async function fetchProfileNames(): Promise<Profile[]> {
  return (await call<{ profiles: Profile[] }>('/api/profiles'))?.profiles ?? []
}

export async function fetchSession(): Promise<Profile | null> {
  return (await call<{ profile: Profile | null }>('/api/auth'))?.profile ?? null
}

export async function login(name: string, pin: string): Promise<Profile | null> {
  return (await call<{ profile: Profile }>('/api/auth', 'POST', { name, pin }))?.profile ?? null
}

export async function logout(): Promise<void> {
  await call('/api/auth', 'DELETE')
}

// ── vocabulary ──────────────────────────────────────────────────────────────

export interface VocabRow {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  wordSet?: string
  archived: boolean
  example?: string
  exampleKo?: string
  synonym?: string
  antonym?: string
}

export async function fetchVocabulary(): Promise<VocabRow[]> {
  return (await call<{ words: VocabRow[] }>('/api/vocabulary'))?.words ?? []
}

export async function setArchived(ids: string[], archived: boolean): Promise<void> {
  if (ids.length === 0) return
  await call('/api/vocabulary/archive', 'POST', { ids, archived })
}

export async function fetchBookmarks(): Promise<string[]> {
  return (await call<{ wordIds: string[] }>('/api/bookmarks'))?.wordIds ?? []
}

export async function setBookmark(wordId: string, bookmarked: boolean): Promise<void> {
  await call('/api/bookmarks', 'PUT', { wordId, bookmarked })
}

export async function insertWords(words: VocabRow[]): Promise<void> {
  if (words.length === 0) return
  await call('/api/vocabulary', 'POST', { words })
}

export async function updateWord(word: VocabRow): Promise<void> {
  await call('/api/vocabulary', 'PATCH', { word })
}

export async function deleteWord(id: string): Promise<void> {
  await call('/api/vocabulary', 'DELETE', { id })
}

// ── word_stats ──────────────────────────────────────────────────────────────

export interface WordStat {
  wordId: string
  correctCount: number
  wrongCount: number
  lastStudied: string | null
  tapCount: number
}

export type MasteryLevel = 'unlearned' | 'learning' | 'familiar' | 'mastered'

export function getMastery(stat: WordStat | undefined): MasteryLevel {
  if (!stat || !stat.lastStudied) return 'unlearned'
  const total = stat.correctCount + stat.wrongCount
  if (total === 0) return 'unlearned'
  const accuracy = stat.correctCount / total
  if (accuracy >= 0.9 && total >= 5) return 'mastered'
  if (accuracy >= 0.6) return 'familiar'
  return 'learning'
}

export async function fetchWordStats(): Promise<WordStat[]> {
  return (await call<{ stats: WordStat[] }>('/api/word-stats'))?.stats ?? []
}

export async function resetWordStats(wordIds: string[]): Promise<void> {
  if (wordIds.length === 0) return
  await call('/api/word-stats/reset', 'POST', { wordIds })
}

export async function upsertWordStat(params: {
  wordId: string
  word: string
  meaning: string
  isCorrect: boolean
}): Promise<WordStat | null> {
  return (await call<{ stat: WordStat }>('/api/word-stats/answer', 'POST', params))?.stat ?? null
}

export async function incrementTapStat(params: {
  wordId: string
  word: string
  meaning: string
}): Promise<{ tapCount: number; lastStudied: string }> {
  return (await call<{ tapCount: number; lastStudied: string }>('/api/word-stats/tap', 'POST', params))
    ?? { tapCount: 0, lastStudied: '' }
}
