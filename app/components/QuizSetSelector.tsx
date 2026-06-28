'use client'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
}

interface QuizSet {
  chapter: number
  question: number
  words: Word[]
}

interface QuizSetSelectorProps {
  words: Word[]
  filterChapter?: number | null
  onSelect: (chapter: number, question: number) => void
  onBack: () => void
}

function setLabel(chapter: number, question: number): string {
  if (chapter === 0) return '챕터 미지정'
  if (question === 0) return `${chapter}챕터`
  return `${chapter}챕터 ${question}번`
}

export default function QuizSetSelector({ words, filterChapter, onSelect, onBack }: QuizSetSelectorProps) {
  const filteredWords = filterChapter != null ? words.filter(w => w.chapter === filterChapter) : words
  const setMap = new Map<string, Word[]>()
  for (const w of filteredWords) {
    const key = `${w.chapter}-${w.question}`
    if (!setMap.has(key)) setMap.set(key, [])
    setMap.get(key)!.push(w)
  }

  const sets: QuizSet[] = Array.from(setMap.entries())
    .sort(([a], [b]) => {
      const [ac, aq] = a.split('-').map(Number)
      const [bc, bq] = b.split('-').map(Number)
      return ac !== bc ? ac - bc : aq - bq
    })
    .map(([key, ws]) => {
      const [chapter, question] = key.split('-').map(Number)
      return { chapter, question, words: ws }
    })

  // 챕터별로 묶어 헤더 표시용 추적
  const chaptersSeen = new Set<number>()

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 text-zinc-400 gap-2 py-32">
        <p className="text-lg">퀴즈를 풀 단어가 없습니다.</p>
        <p className="text-sm">먼저 단어를 추가해 주세요.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
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
          className="p-2 rounded-lg text-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
          aria-label="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-zinc-900">퀴즈 풀기</h2>
      </div>
      <p className="text-xl text-zinc-500">단어 세트를 선택하세요.</p>
      <ul className="flex flex-col gap-3">
        {sets.map(({ chapter, question, words: ws }) => {
          const isNewChapter = !chaptersSeen.has(chapter)
          chaptersSeen.add(chapter)
          return (
            <li key={`${chapter}-${question}`}>
              {isNewChapter && (
                <p className="text-lg font-semibold text-zinc-400 px-1 mb-2 mt-4 first:mt-0">
                  {chapter === 0 ? '챕터 미지정' : `${chapter}챕터`}
                </p>
              )}
              <button
                onClick={() => onSelect(chapter, question)}
                className="w-full flex items-center justify-between px-6 py-5 rounded-xl border border-sky-100 bg-white shadow hover:border-sky-400 hover:bg-sky-50 hover:shadow-md transition-all text-left"
              >
                <span className="text-xl font-semibold text-zinc-900">
                  {setLabel(chapter, question)}
                </span>
                <span className="text-base text-zinc-500">
                  {ws.length}단어
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
