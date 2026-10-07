import type { NextRequest } from 'next/server'
import { admin } from '../../lib/server/admin'
import { badRequest, getSession, serverError, unauthorized } from '../../lib/server/session'
import type { VocabRow } from '../../lib/api'

const MAX_ROWS = 2000

interface DbRow {
  id: string; word: string; meaning: string; chapter: number
  question: number; pronunciation: string | null; word_set: string | null; archived: boolean | null
  example: string | null; example_ko: string | null; synonym: string | null; antonym: string | null
}

function mapRow(r: DbRow): VocabRow {
  return {
    id: r.id,
    word: r.word,
    meaning: r.meaning,
    chapter: r.chapter,
    question: r.question,
    pronunciation: r.pronunciation ?? undefined,
    wordSet: r.word_set ?? undefined,
    archived: r.archived ?? false,
    example: r.example ?? undefined,
    exampleKo: r.example_ko ?? undefined,
    synonym: r.synonym ?? undefined,
    antonym: r.antonym ?? undefined,
  }
}

const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const optStr = (v: unknown) => (v === undefined || v === null ? null : isStr(v) ? v : undefined)

// 클라이언트 입력에서 허용 필드만 추출/검증
function parseWord(v: unknown) {
  const r = v as Record<string, unknown> | null
  if (!r || !isStr(r.id) || !isStr(r.word) || !isStr(r.meaning) || !isNum(r.chapter) || !isNum(r.question)) return null
  const pronunciation = optStr(r.pronunciation)
  const wordSet = optStr(r.wordSet)
  if (pronunciation === undefined || wordSet === undefined) return null
  return { id: r.id, word: r.word, meaning: r.meaning, chapter: r.chapter, question: r.question, pronunciation, word_set: wordSet }
}

export async function GET() {
  if (!(await getSession())) return unauthorized()
  const pageSize = 1000
  const rows: DbRow[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin()
      .from('vocabulary')
      .select('id, word, meaning, chapter, question, pronunciation, word_set, archived, example, example_ko, synonym, antonym')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }) // created_at 동률(일괄 등록) 시 페이지 경계에서 중복/누락 방지
      .range(from, from + pageSize - 1)
    if (error) return serverError(error)
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }
  return Response.json({ words: rows.map(mapRow) })
}

// 단어 추가
export async function POST(request: NextRequest) {
  if (!(await getSession())) return unauthorized()
  const body = await request.json().catch(() => null)
  if (!Array.isArray(body?.words) || body.words.length === 0 || body.words.length > MAX_ROWS) return badRequest()
  const rows = body.words.map(parseWord)
  if (rows.some((r: unknown) => r === null)) return badRequest()
  const { error } = await admin().from('vocabulary').insert(rows)
  if (error) return serverError(error)
  return Response.json({ ok: true })
}

// 단어 수정
export async function PATCH(request: NextRequest) {
  if (!(await getSession())) return unauthorized()
  const body = await request.json().catch(() => null)
  const row = parseWord(body?.word)
  if (!row) return badRequest()
  const { id, ...fields } = row
  const { error } = await admin().from('vocabulary').update(fields).eq('id', id)
  if (error) return serverError(error)
  return Response.json({ ok: true })
}

// 단어 삭제
export async function DELETE(request: NextRequest) {
  if (!(await getSession())) return unauthorized()
  const body = await request.json().catch(() => null)
  if (!isStr(body?.id)) return badRequest()
  const { error } = await admin().from('vocabulary').delete().eq('id', body.id)
  if (error) return serverError(error)
  return Response.json({ ok: true })
}
