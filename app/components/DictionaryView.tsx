'use client'

import { useMemo, useState } from 'react'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  archived: boolean
}

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
                  {w.archived && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      보관됨
                    </span>
                  )}
                </div>
                <span className="text-base text-zinc-600">{w.meaning}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
