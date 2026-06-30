'use client'

import { useState, useRef, useEffect } from 'react'
import { getMastery, type WordStat, type MasteryLevel } from '../lib/supabase'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
}

interface WordListProps {
  words: Word[]
  wordStats: Map<string, WordStat>
  onDelete: (id: string) => void
  onEdit: (word: Word) => void
  resetKey?: number
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; dot: string; text: string; bg: string }> = {
  unlearned: { label: '미학습',  dot: 'bg-zinc-300',    text: 'text-zinc-500',   bg: 'bg-zinc-100' },
  learning:  { label: '학습 중', dot: 'bg-green-400',   text: 'text-green-600',  bg: 'bg-green-50' },
  familiar:  { label: '익숙함',  dot: 'bg-yellow-400',  text: 'text-yellow-700', bg: 'bg-yellow-50' },
  mastered:  { label: '완료',    dot: 'bg-green-500',   text: 'text-green-700',  bg: 'bg-green-50' },
}

function MasteryBadge({ stat, tapCount = 0 }: { stat: WordStat | undefined; tapCount?: number }) {
  let level = getMastery(stat)
  if (level === 'unlearned' && tapCount > 0) level = 'learning'
  const cfg = MASTERY_CONFIG[level]
  const total = stat ? stat.correctCount + stat.wrongCount : 0
  const accuracy = total > 0 ? Math.round((stat!.correctCount / total) * 100) : null
  const showAccuracy = level === 'familiar' || level === 'mastered'
  return (
    <div className={`inline-flex self-start items-center gap-1.5 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {showAccuracy && accuracy !== null
        ? <span className="text-sm font-medium">정답률 {accuracy}%</span>
        : <span className="text-sm font-medium">{cfg.label}</span>
      }
    </div>
  )
}

function getMeaningClass(len: number): string {
  if (len <= 10) return 'text-2xl'
  if (len <= 25) return 'text-xl'
  if (len <= 50) return 'text-lg'
  return 'text-sm leading-relaxed'
}

const BOOKMARK_KEY = 'wordnote-bookmarks'
const TAP_COUNT_KEY = 'wordnote-tap-counts'

export default function WordList({ words, wordStats, onDelete, onEdit, resetKey }: WordListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())
  const [bookmarkOnly, setBookmarkOnly] = useState(false)
  const [tapCounts, setTapCounts] = useState<Map<string, number>>(new Map())
  const [query, setQuery] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY)
      if (saved) setBookmarked(new Set(JSON.parse(saved)))
    } catch {}
    try {
      const saved = localStorage.getItem(TAP_COUNT_KEY)
      if (saved) setTapCounts(new Map(Object.entries<number>(JSON.parse(saved))))
    } catch {}
  }, [])

  useEffect(() => {
    if (!resetKey) return
    setTapCounts(new Map())
    try { localStorage.removeItem(TAP_COUNT_KEY) } catch {}
  }, [resetKey])

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdFiredRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const expandTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  function incrementTap(id: string) {
    setTapCounts(prev => {
      const next = new Map(prev)
      next.set(id, (next.get(id) ?? 0) + 1)
      try { localStorage.setItem(TAP_COUNT_KEY, JSON.stringify(Object.fromEntries(next))) } catch {}
      return next
    })
  }

  function toggleExpanded(id: string) {
    const isShowing = expanded.has(id)
    const existing = expandTimersRef.current.get(id)
    if (existing) {
      clearTimeout(existing)
      expandTimersRef.current.delete(id)
    }
    if (!isShowing) incrementTap(id)
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        const timer = setTimeout(() => {
          setExpanded(p => { const n = new Set(p); n.delete(id); return n })
          expandTimersRef.current.delete(id)
        }, 3000)
        expandTimersRef.current.set(id, timer)
      }
      return next
    })
  }

  function toggleBookmark(id: string) {
    setBookmarked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  function startHold(e: React.PointerEvent, id: string) {
    startPosRef.current = { x: e.clientX, y: e.clientY }
    holdFiredRef.current = false
    holdTimerRef.current = setTimeout(() => {
      holdFiredRef.current = true
      toggleBookmark(id)
    }, 600)
  }

  function moveHold(e: React.PointerEvent) {
    if (!holdTimerRef.current || !startPosRef.current) return
    if (Math.abs(e.clientX - startPosRef.current.x) > 10 ||
        Math.abs(e.clientY - startPosRef.current.y) > 10) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  function endHold(id: string) {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (!holdFiredRef.current) toggleExpanded(id)
    holdFiredRef.current = false
  }

  function cancelHold() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    holdFiredRef.current = false
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-sky-300 gap-2 py-32">
        <p className="text-lg">아직 단어가 없습니다.</p>
        <p className="text-sm">헤더의 단어 추가 버튼을 눌러 시작하세요.</p>
      </div>
    )
  }

  const bookmarkCount = words.filter(w => bookmarked.has(w.id)).length
  const q = query.trim().toLowerCase()
  const displayWords = words
    .filter(w => !bookmarkOnly || bookmarked.has(w.id))
    .filter(w => !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) || (w.pronunciation ?? '').toLowerCase().includes(q))

  return (
    <div className="flex flex-col flex-1">
      {/* 검색 + 초록 단어 필터 */}
      <div className="flex flex-col gap-2 px-5 pt-4 pb-1">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="단어, 뜻, 발음 검색..."
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-sky-100 bg-sky-50 text-sm text-zinc-800 placeholder-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBookmarkOnly(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              bookmarkOnly
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            초록 단어 모아보기 {bookmarkCount > 0 && <span className="opacity-80">{bookmarkCount}</span>}
          </button>
        </div>
      </div>

      {bookmarkOnly && bookmarkCount === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-zinc-300 gap-2 py-32">
          <p className="text-base">북마크된 단어가 없습니다.</p>
          <p className="text-sm">카드를 길게 누르면 초록 단어로 지정됩니다.</p>
        </div>
      ) : (
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
      {displayWords.map((w) => {
        const isExpanded = expanded.has(w.id)
        const isBookmarked = bookmarked.has(w.id)

        return (
          <li
            key={w.id}
            className={`group relative flex flex-col gap-2 p-4 rounded-xl bg-white shadow hover:shadow-lg transition-all cursor-pointer select-none ${
              isBookmarked ? 'border-2 border-green-500' : 'border border-sky-100'
            }`}
            onPointerDown={(e) => startHold(e, w.id)}
            onPointerMove={moveHold}
            onPointerUp={() => endHold(w.id)}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* 수정·삭제 버튼 */}
            <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEdit(w) }}
                className="p-1.5 rounded-lg text-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                aria-label="단어 수정"
              >
                <PencilIcon />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDelete(w.id) }}
                className="p-1.5 rounded-lg text-sky-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="단어 삭제"
              >
                <TrashIcon />
              </button>
            </div>

            {/* 단어명 + 문항번호/발음 */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-xl font-bold text-zinc-900">{w.word}</span>
              <div className="flex flex-col items-end shrink-0 gap-0.5 mt-0.5 min-w-0">
                {(w.chapter > 0 || w.question > 0) && (
                  <span className="text-xs text-zinc-400">{w.chapter}-{w.question}</span>
                )}
                {w.pronunciation && (
                  <span className="text-lg text-zinc-400 text-right">[{w.pronunciation}]</span>
                )}
              </div>
            </div>

            {/* 뜻 (탭 토글) */}
            <div className="min-h-[1.5rem]">
              {isExpanded ? (
                <span className={`${getMeaningClass(w.meaning.length)} text-zinc-700`}>{w.meaning}</span>
              ) : (
                <span className="text-xs text-zinc-300">탭하여 뜻 보기</span>
              )}
            </div>

            <MasteryBadge stat={wordStats.get(w.id)} tapCount={tapCounts.get(w.id) ?? 0} />
          </li>
        )
      })}
      </ul>
      )}
    </div>
  )
}
