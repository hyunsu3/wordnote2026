'use client'

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
  const selectCls = 'px-4 py-2.5 text-base rounded-xl border border-sky-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer'

  return (
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
            onClick={() => { if (confirm('학습 진행상황을 초기화하시겠습니까?')) onResetStats() }}
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
  )
}
