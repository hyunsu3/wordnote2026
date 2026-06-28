import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = url && key ? createClient(url, key) : null

// ── vocabulary ──────────────────────────────────────────────────────────────

export interface VocabRow {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
}

export async function fetchVocabulary(): Promise<VocabRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('vocabulary')
    .select('id, word, meaning, chapter, question, pronunciation')
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function insertWords(words: VocabRow[]): Promise<void> {
  if (!supabase || words.length === 0) return
  const { error } = await supabase.from('vocabulary').insert(words)
  if (error) console.error(error)
}

export async function updateWord(word: VocabRow): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('vocabulary')
    .update({ word: word.word, meaning: word.meaning, chapter: word.chapter, question: word.question, pronunciation: word.pronunciation ?? null })
    .eq('id', word.id)
  if (error) console.error(error)
}

export async function deleteWord(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('vocabulary').delete().eq('id', id)
  if (error) console.error(error)
}

// ── word_stats ──────────────────────────────────────────────────────────────

export interface WordStat {
  wordId: string
  correctCount: number
  wrongCount: number
  lastStudied: string | null
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
  if (!supabase) return []
  const { data, error } = await supabase
    .from('word_stats')
    .select('word_id, correct_count, wrong_count, last_studied')
    .not('word_id', 'is', null)
  if (error) { console.error(error); return [] }
  return (data ?? []).map(r => ({
    wordId: r.word_id,
    correctCount: r.correct_count ?? 0,
    wrongCount: r.wrong_count ?? 0,
    lastStudied: r.last_studied ?? null,
  }))
}

export async function resetWordStats(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('word_stats').delete().neq('word_id', '')
  if (error) console.error(error)
}

export async function upsertWordStat(params: {
  wordId: string
  word: string
  meaning: string
  isCorrect: boolean
}): Promise<WordStat | null> {
  if (!supabase) return null

  const { data: existing } = await supabase
    .from('word_stats')
    .select('id, correct_count, wrong_count')
    .eq('word_id', params.wordId)
    .maybeSingle()

  const now = new Date().toISOString()

  if (existing) {
    const newCorrect = (existing.correct_count ?? 0) + (params.isCorrect ? 1 : 0)
    const newWrong = (existing.wrong_count ?? 0) + (params.isCorrect ? 0 : 1)
    await supabase
      .from('word_stats')
      .update({ correct_count: newCorrect, wrong_count: newWrong, last_studied: now })
      .eq('id', existing.id)
    return { wordId: params.wordId, correctCount: newCorrect, wrongCount: newWrong, lastStudied: now }
  } else {
    await supabase.from('word_stats').insert({
      word_id: params.wordId,
      word: params.word,
      meaning: params.meaning,
      correct_count: params.isCorrect ? 1 : 0,
      wrong_count: params.isCorrect ? 0 : 1,
      last_studied: now,
    })
    return {
      wordId: params.wordId,
      correctCount: params.isCorrect ? 1 : 0,
      wrongCount: params.isCorrect ? 0 : 1,
      lastStudied: now,
    }
  }
}
