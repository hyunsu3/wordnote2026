'use client'

import { useState, useRef } from 'react'

interface HeaderProps {
  onAddWord: () => void
  onStartQuiz: () => void
  onToggleStudy: () => void
  isStudying: boolean
  isStudyPaused: boolean
  studySecondsLeft: number | null
  onResetStats: () => void
  onResetBookmarksInScope: () => void
  onResetView: () => void
  wordSets: string[]
  selectedWordSet: string
  onWordSetChange: (ws: string) => void
  chapters: number[]
  questions: number[]
  selectedChapter: string
  selectedQuestion: string
  onChapterChange: (ch: string) => void
  onQuestionChange: (q: string) => void
  query: string
  setQuery: (q: string) => void
  bookmarkOnly: boolean
  setBookmarkOnly: (v: boolean | ((prev: boolean) => boolean)) => void
  bookmarkCount: number
  canArchive: boolean
  onArchive: () => void
  archivedCount: number
  onOpenArchived: () => void
  onOpenDictionary: () => void
}

function chapterLabel(ch: number) {
  return ch === 0 ? '미지정' : `${ch}챕터`
}

function questionLabel(q: number) {
  return q === 0 ? '미지정' : `${q}번`
}

function formatStudyTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Header({
  onAddWord, onStartQuiz, onToggleStudy, isStudying, isStudyPaused, studySecondsLeft, onResetStats, onResetBookmarksInScope, onResetView,
  wordSets, selectedWordSet, onWordSetChange,
  chapters, questions,
  selectedChapter, selectedQuestion,
  onChapterChange, onQuestionChange,
  query, setQuery, bookmarkOnly, setBookmarkOnly, bookmarkCount,
  canArchive, onArchive, archivedCount, onOpenArchived,
  onOpenDictionary,
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
    } else if (pw === '224500') {
      setShowPw(false)
      onResetStats()
      onResetBookmarksInScope()
    } else {
      setError(true)
      setPw('')
      inputRef.current?.focus()
    }
  }

  const selectCls = 'px-4 py-2.5 text-base rounded-xl border border-green-300 bg-white text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer'

  return (
    <>
    <header className="sticky top-0 z-10 bg-white border-b border-sky-100 shadow-sm">
      <div className="relative flex items-center justify-between px-5 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 cursor-pointer" onClick={onResetView}>보카보카</h1>
        {studySecondsLeft !== null && (
          <span
            className={`absolute left-1/2 -translate-x-1/2 text-3xl font-mono font-bold tabular-nums ${
              studySecondsLeft <= 60 ? 'text-red-500' : 'text-green-500'
            } ${isStudyPaused ? 'opacity-40' : ''}`}
          >
            {formatStudyTime(studySecondsLeft)}
          </span>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddWord}
            className="flex items-center justify-center px-4 py-2.5 text-xl font-medium rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            +
          </button>
          <button
            onClick={onOpenDictionary}
            className="px-4 py-2.5 text-base font-medium rounded-xl text-zinc-500 hover:text-sky-700 hover:bg-sky-50 border border-zinc-200 hover:border-sky-200 transition-colors"
          >
            A to Z
          </button>
          <button
            onClick={onOpenArchived}
            className="px-4 py-2.5 text-base font-medium rounded-xl text-zinc-500 hover:text-amber-700 hover:bg-amber-50 border border-zinc-200 hover:border-amber-200 transition-colors"
          >
            보관함{archivedCount > 0 && ` ${archivedCount}`}
          </button>
          <button
            onClick={openReset}
            className="px-4 py-2.5 text-base font-medium rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition-colors"
          >
            Init!
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-5 py-3 border-t border-sky-50">
        {wordSets.length > 0 && (
          <select
            value={selectedWordSet}
            onChange={e => onWordSetChange(e.target.value)}
            className={selectCls}
          >
            <option value="">전체 세트</option>
            {wordSets.map(ws => (
              <option key={ws} value={ws}>{ws}</option>
            ))}
          </select>
        )}
        {chapters.length > 0 && (
          <>
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
            {!(questions.length === 1 && questions[0] === 0) && (
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
            )}
          </>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleStudy}
            className={`px-4 py-2.5 text-base font-medium rounded-xl bg-sky-500 text-white hover:bg-sky-600 transition-colors ${
              isStudying ? 'ring-2 ring-inset ring-sky-900' : ''
            }`}
          >
            {!isStudying ? '학습 시작' : isStudyPaused ? '이어하기' : '잠깐 휴식'}
          </button>
          <button
            onClick={onStartQuiz}
            className="px-4 py-2.5 text-base font-medium rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            퀴즈 시작
          </button>
          <button
            onClick={onArchive}
            disabled={!canArchive}
            className="px-4 py-2.5 text-base font-medium rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-transparent"
          >
            보관 처리
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1 basis-full min-w-0">
          <button
            onClick={() => setBookmarkOnly(v => !v)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              bookmarkOnly
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            초록 단어 모아보기 {bookmarkCount > 0 && <span className="opacity-80">{bookmarkCount}</span>}
          </button>
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="검색..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-green-300 bg-white text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-green-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
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
