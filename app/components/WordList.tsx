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
  bookmarked: Set<string>
  onToggleBookmark: (id: string) => void
  bookmarkOnly: boolean
  hasAnyWords: boolean
  onTap: (id: string, word: string, meaning: string) => void
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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


export default function WordList({ words, wordStats, onDelete, onEdit, resetKey, bookmarked, onToggleBookmark, bookmarkOnly, hasAnyWords, onTap }: WordListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!resetKey) return
    setExpanded(new Set())
  }, [resetKey])

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdFiredRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const expandTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  function toggleExpanded(id: string, word: string, meaning: string) {
    const isShowing = expanded.has(id)
    const existing = expandTimersRef.current.get(id)
    if (existing) {
      clearTimeout(existing)
      expandTimersRef.current.delete(id)
    }
    if (!isShowing) onTap(id, word, meaning)
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

  function startHold(e: React.PointerEvent, id: string) {
    startPosRef.current = { x: e.clientX, y: e.clientY }
    holdFiredRef.current = false
    holdTimerRef.current = setTimeout(() => {
      holdFiredRef.current = true
      onToggleBookmark(id)
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
    if (!holdFiredRef.current) {
      const w = words.find(w => w.id === id)
      if (w) toggleExpanded(id, w.word, w.meaning)
    }
    holdFiredRef.current = false
  }

  function cancelHold() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    holdFiredRef.current = false
  }

  if (!hasAnyWords) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-sky-300 gap-2 py-32">
        <p className="text-lg">아직 단어가 없습니다.</p>
        <p className="text-sm">헤더의 단어 추가 버튼을 눌러 시작하세요.</p>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-zinc-300 gap-2 py-32">
        {bookmarkOnly
          ? <><p className="text-base">북마크된 단어가 없습니다.</p><p className="text-sm">카드를 길게 누르면 초록 단어로 지정됩니다.</p></>
          : <p className="text-base">검색 결과가 없습니다.</p>
        }
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
      {words.map((w) => {
        const isExpanded = expanded.has(w.id)
        const isBookmarked = bookmarked.has(w.id)

        return (
          <li
            key={w.id}
            className={`group relative flex flex-col gap-2 p-4 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer select-none ${
              isBookmarked ? 'border-2 border-green-500 bg-green-50' : 'border border-zinc-300 bg-white'
            }`}
            onPointerDown={(e) => startHold(e, w.id)}
            onPointerMove={moveHold}
            onPointerUp={() => endHold(w.id)}
            onPointerLeave={cancelHold}
            onPointerCancel={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* 수정·삭제 버튼 */}
            <div className="absolute bottom-2 right-2 hidden group-hover:flex gap-1 z-10">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEdit(w) }}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="단어 수정"
              >
                <PencilIcon />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDelete(w.id) }}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="단어 삭제"
              >
                <TrashIcon />
              </button>
            </div>

            {/* 단어명 + 문항번호 */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl font-bold text-zinc-900 break-words min-w-0">{w.word}</span>
              {(w.chapter > 0 || w.question > 0) && (
                <span className="text-base text-zinc-600 shrink-0 mt-1">{w.chapter}-{w.question}</span>
              )}
            </div>
            {/* 뜻 + 발음 (탭 토글) */}
            <div className="min-h-[1.5rem]">
              {isExpanded ? (
                <span className="text-2xl text-zinc-700 leading-snug">{w.meaning}</span>
              ) : (
                <span className="text-sm text-zinc-500">탭하여 뜻 보기</span>
              )}
            </div>

            <MasteryBadge stat={wordStats.get(w.id)} tapCount={wordStats.get(w.id)?.tapCount ?? 0} />
          </li>
        )
      })}
      </ul>
    </div>
  )
}
