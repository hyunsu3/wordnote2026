'use client'

import { useMemo, useState } from 'react'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  wordSet?: string
  archived: boolean
  example?: string
  synonym?: string
  antonym?: string
}

function chapterLabel(ch: number) {
  return ch === 0 ? '미지정' : `${ch}챕터`
}

// Fixed-order categorical palette, validated for CVD-safe adjacent contrast (dataviz skill).
const WORD_SET_TAG_PALETTE = [
  { bg: 'bg-sky-100', text: 'text-sky-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
]

interface DictionaryViewProps {
  words: Word[]
  onBack: () => void
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function firstLetterOf(word: string): string {
  const ch = word.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(ch) ? ch : ''
}

export default function DictionaryView({ words, onBack }: DictionaryViewProps) {
  const sortedWords = useMemo(
    () => [...words].sort((a, b) => a.word.localeCompare(b.word)),
    [words]
  )

  const availableLetters = useMemo(
    () => new Set(sortedWords.map(w => firstLetterOf(w.word)).filter(Boolean)),
    [sortedWords]
  )

  const [selectedLetter, setSelectedLetter] = useState<string>(
    () => LETTERS.find(l => sortedWords.some(w => firstLetterOf(w.word) === l)) ?? 'A'
  )

  const letterWords = useMemo(
    () => sortedWords.filter(w => firstLetterOf(w.word) === selectedLetter),
    [sortedWords, selectedLetter]
  )

  const wordSetTagOf = useMemo(() => {
    const sets = [...new Set(words.map(w => w.wordSet).filter((v): v is string => !!v))].sort()
    const map = new Map(sets.map((ws, i) => [ws, WORD_SET_TAG_PALETTE[i % WORD_SET_TAG_PALETTE.length]]))
    return (wordSet: string) => map.get(wordSet) ?? { bg: 'bg-zinc-100', text: 'text-zinc-500' }
  }, [words])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-sky-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">딕셔너리</h1>
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-base font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
          >
            단어학습으로
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 px-5 py-3 border-t border-sky-50">
          {LETTERS.map(letter => {
            const has = availableLetters.has(letter)
            return (
              <button
                key={letter}
                onClick={() => has && setSelectedLetter(letter)}
                disabled={!has}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors ${
                  selectedLetter === letter
                    ? 'bg-sky-500 text-white border-sky-500'
                    : has
                      ? 'text-zinc-600 border-zinc-200 hover:bg-sky-50 hover:border-sky-200'
                      : 'text-zinc-300 border-transparent cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </header>

      <main className="flex flex-col flex-1">
        {letterWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-zinc-300 gap-2 py-32">
            <p className="text-base">&apos;{selectedLetter}&apos;로 시작하는 단어가 없습니다.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-100 px-5">
            {letterWords.map(w => (
              <li key={w.id} className="flex flex-col gap-1 py-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-zinc-900">{w.word}</span>
                  {w.pronunciation && (
                    <span className="text-sm text-zinc-400">[{w.pronunciation}]</span>
                  )}
                  {w.wordSet && (
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${wordSetTagOf(w.wordSet).bg} ${wordSetTagOf(w.wordSet).text}`}>
                      {w.wordSet}
                    </span>
                  )}
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-100 rounded-full px-2 py-0.5">
                    {chapterLabel(w.chapter)}
                  </span>
                  {w.archived && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      보관됨
                    </span>
                  )}
                </div>
                <span className="text-base text-zinc-600">{w.meaning}</span>
                {(w.synonym || w.antonym) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {w.synonym && (
                      <span className="text-sky-600">
                        <span className="text-zinc-400">동의어</span> {w.synonym}
                      </span>
                    )}
                    {w.antonym && (
                      <span className="text-rose-600">
                        <span className="text-zinc-400">반의어</span> {w.antonym}
                      </span>
                    )}
                  </div>
                )}
                {w.example && (
                  <p className="text-sm text-zinc-500 italic">&quot;{w.example}&quot;</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
