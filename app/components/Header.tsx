'use client'

interface HeaderProps {
  onAddWord: () => void
  onStartQuiz: () => void
}

export default function Header({ onAddWord, onStartQuiz }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        단어장
      </h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onAddWord}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <span className="text-base leading-none">+</span>
          단어 추가
        </button>
        <button
          onClick={onStartQuiz}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          퀴즈 풀기
        </button>
      </div>
    </header>
  )
}
