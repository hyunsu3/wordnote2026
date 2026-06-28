'use client'

import { useState, useEffect, useCallback } from 'react'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
}

type QuizType = 'en_to_ko' | 'ko_to_en'

interface Question {
  word: Word
  quizType: QuizType
  prompt: string
  answer: string
  choices: string[]
}

interface QuizViewProps {
  setWords: Word[]
  allWords: Word[]
  chapterLabel: string
  onAnswer: (wordId: string, word: string, meaning: string, isCorrect: boolean) => void
  onBack: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(setWords: Word[], allWords: Word[]): Question[] {
  const shuffledSet = shuffle(setWords)
  return shuffledSet.map((w) => {
    const quizType: QuizType = Math.random() < 0.5 ? 'en_to_ko' : 'ko_to_en'
    const prompt = quizType === 'en_to_ko' ? w.word : w.meaning
    const answer = quizType === 'en_to_ko' ? w.meaning : w.word

    const wrongPool = allWords
      .filter((aw) => aw.id !== w.id)
      .map((aw) => (quizType === 'en_to_ko' ? aw.meaning : aw.word))
      .filter((val, idx, arr) => arr.indexOf(val) === idx && val !== answer)

    const wrongs = shuffle(wrongPool).slice(0, 3)

    while (wrongs.length < 3) {
      wrongs.push(`오답 ${wrongs.length + 1}`)
    }

    const choices = shuffle([answer, ...wrongs])
    return { word: w, quizType, prompt, answer, choices }
  })
}

export default function QuizView({ setWords, allWords, chapterLabel, onAnswer, onBack }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    setQuestions(buildQuestions(setWords, allWords))
    setIndex(0)
    setSelected(null)
    setScore(0)
  }, [setWords, allWords])

  const current = questions[index]
  const isComplete = index >= questions.length && questions.length > 0

  const handleSelect = useCallback((choice: string) => {
    if (selected !== null) return
    setSelected(choice)
    const isCorrect = choice === current.answer
    if (isCorrect) setScore((s) => s + 1)
    onAnswer(current.word.id, current.word.word, current.word.meaning, isCorrect)
  }, [selected, current])

  function handleNext() {
    setIndex((i) => i + 1)
    setSelected(null)
  }

  // 자동 넘김: 정답 1.5s / 오답 2.5s
  useEffect(() => {
    if (selected === null) return
    const isCorrect = selected === current?.answer
    const delay = isCorrect ? 1500 : 2500
    const timer = setTimeout(handleNext, delay)
    return () => clearTimeout(timer)
  }, [selected])

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 text-zinc-400">
        <p>문제를 불러오는 중...</p>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">{score} / {questions.length}</span>
          <p className="text-zinc-500 dark:text-zinc-400">{chapterLabel} 퀴즈 완료</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            세트 선택으로
          </button>
          <button
            onClick={() => {
              setQuestions(buildQuestions(setWords, allWords))
              setIndex(0)
              setSelected(null)
              setScore(0)
            }}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            다시 풀기
          </button>
        </div>
      </div>
    )
  }

  const answered = selected !== null

  return (
    <div className="flex flex-col flex-1 p-6 gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          aria-label="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{index + 1} / {questions.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
          {current.quizType === 'en_to_ko' ? '뜻을 고르세요' : '영어 단어를 고르세요'}
        </p>
        <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 break-all">{current.prompt}</h3>
        {current.quizType === 'en_to_ko' && current.word.pronunciation && (
          <p className="text-base text-zinc-400 dark:text-zinc-500">[{current.word.pronunciation}]</p>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {current.choices.map((choice) => {
          const isAnswer = choice === current.answer
          const isSelected = choice === selected
          let cls = 'w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-colors '
          if (!answered) {
            cls += 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
          } else if (isAnswer) {
            cls += 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
          } else if (isSelected) {
            cls += 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
          } else {
            cls += 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 opacity-50'
          }
          return (
            <li key={choice}>
              <button className={cls} onClick={() => handleSelect(choice)} disabled={answered}>
                {choice}
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div className="flex flex-col gap-2">
          <div className={`p-3 rounded-lg text-sm font-medium ${selected === current.answer ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
            <span>{selected === current.answer ? '정답입니다!' : `오답입니다. 정답: ${current.answer}`}</span>
            {current.quizType === 'ko_to_en' && current.word.pronunciation && (
              <span className="ml-2 opacity-70">[{current.word.pronunciation}]</span>
            )}
          </div>
          <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              key={selected}
              className={`h-full rounded-full ${selected === current.answer ? 'bg-green-400 dark:bg-green-500' : 'bg-red-400 dark:bg-red-500'}`}
              style={{ animation: `shrink-bar ${selected === current.answer ? '1.5s' : '2.5s'} linear forwards` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
