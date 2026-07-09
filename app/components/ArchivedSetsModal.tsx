'use client'

interface ArchivedWord {
  chapter: number
  question: number
  wordSet?: string
}

interface ArchivedSetsModalProps {
  archivedWords: ArchivedWord[]
  onRestore: (wordSet: string | undefined, chapter: number, question: number) => void
  onClose: () => void
}

function chapterLabel(ch: number) {
  return ch === 0 ? '챕터 미지정' : `${ch}챕터`
}

function questionLabel(q: number) {
  return q === 0 ? '문항 미지정' : `${q}번`
}

export default function ArchivedSetsModal({ archivedWords, onRestore, onClose }: ArchivedSetsModalProps) {
  const groups = new Map<string, { wordSet?: string; chapter: number; question: number; count: number }>()
  for (const w of archivedWords) {
    const key = `${w.wordSet ?? ''}-${w.chapter}-${w.question}`
    const existing = groups.get(key)
    if (existing) existing.count++
    else groups.set(key, { wordSet: w.wordSet, chapter: w.chapter, question: w.question, count: 1 })
  }
  const groupList = [...groups.values()]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[80vh]">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">보관함</h2>
        {groupList.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">보관된 단어가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {groupList.map(g => (
              <li
                key={`${g.wordSet ?? ''}-${g.chapter}-${g.question}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {g.wordSet && <span className="font-medium text-zinc-900 dark:text-zinc-100">{g.wordSet}</span>}
                  {g.wordSet && ' · '}
                  {chapterLabel(g.chapter)} · {questionLabel(g.question)}
                  <span className="ml-1.5 text-zinc-400 dark:text-zinc-500">{g.count}개</span>
                </span>
                <button
                  onClick={() => onRestore(g.wordSet, g.chapter, g.question)}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  복원
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
