'use client'

import { useState } from 'react'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  wordSet?: string
  archived: boolean
}

interface EditWordModalProps {
  word: Word
  onSave: (updated: Word) => void
  onCancel: () => void
  wordSets: string[]
}

export default function EditWordModal({ word, onSave, onCancel, wordSets }: EditWordModalProps) {
  const [form, setForm] = useState({
    word: word.word,
    meaning: word.meaning,
    pronunciation: word.pronunciation ?? '',
    chapter: word.chapter === 0 ? '' : String(word.chapter),
    question: word.question === 0 ? '' : String(word.question),
    wordSet: word.wordSet ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    if (!form.word.trim() || !form.meaning.trim()) return
    onSave({
      id: word.id,
      word: form.word.trim(),
      meaning: form.meaning.trim(),
      pronunciation: form.pronunciation.trim() || undefined,
      chapter: Number(form.chapter) || 0,
      question: Number(form.question) || 0,
      wordSet: form.wordSet.trim() || undefined,
      archived: word.archived,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">단어 수정</h2>
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            name="word"
            value={form.word}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="단어"
            className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
          <input
            name="meaning"
            value={form.meaning}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="뜻"
            className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
          <input
            name="pronunciation"
            value={form.pronunciation}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="발음 (선택, 예: ɪnˈtɜːrprɪt)"
            className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
          <input
            name="wordSet"
            list="word-set-options-edit"
            value={form.wordSet ?? ''}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="단어 세트 (선택, 예: 기말3-1)"
            className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
          />
          <datalist id="word-set-options-edit">
            {wordSets.map(ws => <option key={ws} value={ws} />)}
          </datalist>
          <div className="flex gap-2">
            <input
              name="chapter"
              type="number"
              min={0}
              value={form.chapter}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="챕터 번호"
              className="w-1/2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
            />
            <input
              name="question"
              type="number"
              min={0}
              value={form.question}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="문항 번호"
              className="w-1/2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.word.trim() || !form.meaning.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
