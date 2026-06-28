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

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; dot: string; text: string; bg: string }> = {
  unlearned: { label: '미학습',  dot: 'bg-zinc-300',    text: 'text-zinc-500',   bg: 'bg-zinc-100' },
  learning:  { label: '학습 중', dot: 'bg-red-400',     text: 'text-red-600',    bg: 'bg-red-50' },
  familiar:  { label: '익숙함',  dot: 'bg-yellow-400',  text: 'text-yellow-700', bg: 'bg-yellow-50' },
  mastered:  { label: '완료',    dot: 'bg-green-500',   text: 'text-green-700',  bg: 'bg-green-50' },
}

function MasteryBadge({ stat }: { stat: WordStat | undefined }) {
  const level = getMastery(stat)
  const cfg = MASTERY_CONFIG[level]
  const total = stat ? stat.correctCount + stat.wrongCount : 0
  const accuracy = total > 0 ? Math.round((stat!.correctCount / total) * 100) : null

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-sm font-medium">{cfg.label}</span>
      {accuracy !== null && (
        <span className="text-sm opacity-80">{accuracy}%</span>
      )}
    </div>
  )
}

export default function WordList({ words, wordStats, onDelete, onEdit }: WordListProps) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-sky-300 gap-2 py-32">
        <p className="text-lg">아직 단어가 없습니다.</p>
        <p className="text-sm">헤더의 단어 추가 버튼을 눌러 시작하세요.</p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
      {words.map((w) => (
        <li
          key={w.id}
          className="group relative flex flex-col gap-1 p-4 rounded-xl border border-sky-100 bg-white shadow hover:shadow-lg transition-all"
        >
          <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
            <button
              onClick={() => onEdit(w)}
              className="p-1.5 rounded-lg text-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-colors"
              aria-label="단어 수정"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(w.id)}
              className="p-1.5 rounded-lg text-sky-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="단어 삭제"
            >
              <TrashIcon />
            </button>
          </div>
          <div className="flex items-start justify-between gap-2 pr-14">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold text-zinc-900">{w.word}</span>
              {w.pronunciation && (
                <span className="text-base text-zinc-400">[{w.pronunciation}]</span>
              )}
            </div>
            {(w.chapter > 0 || w.question > 0) && (
              <span className="shrink-0 text-xs text-zinc-400 mt-0.5">
                {w.chapter}-{w.question}
              </span>
            )}
          </div>
          <span className="text-base text-zinc-600">{w.meaning}</span>
          <div className="mt-1">
            <MasteryBadge stat={wordStats.get(w.id)} />
          </div>
        </li>
      ))}
    </ul>
  )
}
