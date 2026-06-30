'use client'

import { useState, useRef } from 'react'

interface HeaderProps {
  onAddWord: () => void
  onStartQuiz: () => void
  onResetStats: () => void
  chapters: number[]
  questions: number[]
  selectedChapter: string
  selectedQuestion: string
  onChapterChange: (ch: string) => void
  onQuestionChange: (q: string) => void
}

function chapterLabel(ch: number) {
  return ch === 0 ? '미지정' : `${ch}챕터`
}

function questionLabel(q: number) {
  return q === 0 ? '미지정' : `${q}번`
}

export default function Header({
  onAddWord, onStartQuiz, onResetStats,
  chapters, questions,
  selectedChapter, selectedQuestion,
  onChapterChange, onQuestionChange,
}: HeaderProps) {
  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function openReset() {
    setPw('')
    setError(false)
    setShowPw(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function confirmReset() {
    if (pw === '2245') {
      setShowPw(false)
      onResetStats()
    } else {
      setError(true)
      setPw('')
      inputRef.current?.focus()
    }
  }

  const selectCls = 'px-4 py-2.5 text-base rounded-xl border border-sky-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer'

  return (
    <>
    <header className="sticky top-0 z-10 bg-white border-b border-sky-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">맘스보카</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddWord}
            className="flex items-center gap-1.5 px-5 py-2.5 text-base font-medium rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            단어 추가
          </button>
          <button
            onClick={onStartQuiz}
            className="px-5 py-2.5 text-base font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors"
          >
            퀴즈 풀기
          </button>
          <button
            onClick={openReset}
            className="px-5 py-2.5 text-base font-medium rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {chapters.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 border-t border-sky-50">
          <select
            value={selectedChapter}
            onChange={e => onChapterChange(e.target.value)}
            className={selectCls}
          >
            <option value="">전체 챕터</option>
            {chapters.map(ch => (
              <option key={ch} value={String(ch)}>{chapterLabel(ch)}</option>
            ))}
          </select>

          <select
            value={selectedQuestion}
            onChange={e => onQuestionChange(e.target.value)}
            disabled={!selectedChapter || questions.length === 0}
            className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <option value="">전체 문항</option>
            {questions.map(q => (
              <option key={q} value={String(q)}>{questionLabel(q)}</option>
            ))}
          </select>
        </div>
      )}
    </header>

      {showPw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPw(false) }}
        >
          <div className="w-full max-w-xs mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-zinc-800">초기화 비밀번호 입력</h2>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmReset(); if (e.key === 'Escape') setShowPw(false) }}
              placeholder="비밀번호"
              className={`w-full px-3 py-2 rounded-lg border text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm ${error ? 'border-red-400 bg-red-50' : 'border-sky-200 bg-sky-50'}`}
            />
            {error && <p className="text-sm text-red-500 -mt-2">비밀번호가 틀렸습니다.</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPw(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
