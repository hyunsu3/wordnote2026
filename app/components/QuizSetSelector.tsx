interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
}

interface WordSet {
  chapter: number
  words: Word[]
}

interface QuizSetSelectorProps {
  words: Word[]
  onSelect: (chapter: number) => void
  onBack: () => void
}

export default function QuizSetSelector({ words, onSelect, onBack }: QuizSetSelectorProps) {
  const chapterMap = new Map<number, Word[]>()
  for (const w of words) {
    const ch = w.chapter
    if (!chapterMap.has(ch)) chapterMap.set(ch, [])
    chapterMap.get(ch)!.push(w)
  }
  const sets: WordSet[] = Array.from(chapterMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([chapter, ws]) => ({ chapter, words: ws }))

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-600 gap-2 py-32">
        <p className="text-lg">퀴즈를 풀 단어가 없습니다.</p>
        <p className="text-sm">먼저 단어를 추가해 주세요.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 p-6 gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">퀴즈 풀기</h2>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">퀴즈를 풀 단어 세트를 선택하세요.</p>
      <ul className="flex flex-col gap-3">
        {sets.map(({ chapter, words: ws }) => (
          <li key={chapter}>
            <button
              onClick={() => onSelect(chapter)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all text-left"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {chapter === 0 ? '챕터 미지정' : `${chapter}챕터`}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {ws.length}단어
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
