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

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; dot: string; text: string }> = {
  unlearned: { label: '미학습',  dot: 'bg-zinc-300 dark:bg-zinc-600',       text: 'text-zinc-400 dark:text-zinc-500' },
  learning:  { label: '학습 중', dot: 'bg-red-400 dark:bg-red-500',          text: 'text-red-500 dark:text-red-400' },
  familiar:  { label: '익숙함',  dot: 'bg-yellow-400 dark:bg-yellow-500',    text: 'text-yellow-600 dark:text-yellow-400' },
  mastered:  { label: '완료',    dot: 'bg-green-400 dark:bg-green-500',      text: 'text-green-600 dark:text-green-400' },
}

function MasteryBadge({ stat }: { stat: WordStat | undefined }) {
  const level = getMastery(stat)
  const cfg = MASTERY_CONFIG[level]
  const total = stat ? stat.correctCount + stat.wrongCount : 0
  const accuracy = total > 0 ? Math.round((stat!.correctCount / total) * 100) : null

  return (
    <div className={`flex items-center gap-1 ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-xs">{cfg.label}</span>
      {accuracy !== null && (
        <span className="text-xs opacity-70">({accuracy}%)</span>
      )}
    </div>
  )
}

export default function WordList({ words, wordStats, onDelete, onEdit }: WordListProps) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-600 gap-2 py-32">
        <p className="text-lg">아직 단어가 없습니다.</p>
        <p className="text-sm">헤더의 단어 추가 버튼을 눌러 시작하세요.</p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
      {words.map((w) => (
        <li
          key={w.id}
          className="group relative flex flex-col gap-1 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
        >
          <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
            <button
              onClick={() => onEdit(w)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="단어 수정"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(w.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors"
              aria-label="단어 삭제"
            >
              <TrashIcon />
            </button>
          </div>
          <div className="flex items-start justify-between gap-2 pr-14">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{w.word}</span>
              {w.pronunciation && (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">[{w.pronunciation}]</span>
              )}
            </div>
            {(w.chapter > 0 || w.question > 0) && (
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {w.chapter}-{w.question}
              </span>
            )}
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{w.meaning}</span>
          <div className="mt-1">
            <MasteryBadge stat={wordStats.get(w.id)} />
          </div>
        </li>
      ))}
    </ul>
  )
}
