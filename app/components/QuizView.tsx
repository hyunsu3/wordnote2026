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
  onGoToList: () => void
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

export default function QuizView({ setWords, allWords, chapterLabel, onAnswer, onBack, onGoToList }: QuizViewProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<Word[]>([])
  const [isFinalComplete, setIsFinalComplete] = useState(false)
  const [initialCount, setInitialCount] = useState(0)

  useEffect(() => {
    const qs = buildQuestions(setWords, allWords)
    setQuestions(qs)
    setIndex(0)
    setSelected(null)
    setScore(0)
    setWrongWords([])
    setIsFinalComplete(false)
    setInitialCount(setWords.length)
  }, [setWords, allWords])

  const current = questions[index]

  const handleSelect = useCallback((choice: string) => {
    if (selected !== null) return
    setSelected(choice)
    const isCorrect = choice === current.answer
    if (isCorrect) {
      setScore((s) => s + 1)
    } else {
      setWrongWords((prev) => [...prev, current.word])
    }
    onAnswer(current.word.id, current.word.word, current.word.meaning, isCorrect)
  }, [selected, current])

  function handleNext() {
    const nextIndex = index + 1
    if (nextIndex >= questions.length) {
      if (wrongWords.length > 0) {
        // 오답만으로 다음 라운드 자동 시작
        setQuestions(buildQuestions(wrongWords, allWords))
        setIndex(0)
        setSelected(null)
        setScore(0)
        setWrongWords([])
      } else {
        setIsFinalComplete(true)
      }
    } else {
      setIndex(nextIndex)
      setSelected(null)
    }
  }

  // 자동 넘김: 정답 1.5s / 오답 2.5s
  useEffect(() => {
    if (selected === null) return
    const isCorrect = selected === current?.answer
    const delay = isCorrect ? 700 : 2500
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

  if (isFinalComplete) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold text-zinc-900">🎉</span>
          <span className="text-2xl font-bold text-zinc-900 mt-2">{initialCount}개 전부 완료!</span>
          <p className="text-zinc-500">{chapterLabel} 퀴즈 완료</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onGoToList}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            단어 목록으로
          </button>
          <button
            onClick={() => {
              const qs = buildQuestions(setWords, allWords)
              setQuestions(qs)
              setIndex(0)
              setSelected(null)
              setScore(0)
              setWrongWords([])
              setIsFinalComplete(false)
              setInitialCount(setWords.length)
            }}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
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
          className="p-2 rounded-lg text-sky-400 hover:text-sky-700 hover:bg-sky-50 transition-colors"
          aria-label="뒤로가기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-3 text-lg text-zinc-500">
          <span>{index + 1} / {questions.length}</span>
          {wrongWords.length > 0 && (
            <span className="text-base text-red-400">오답 {wrongWords.length}개 대기 중</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xl font-medium text-zinc-400">
          {current.quizType === 'en_to_ko' ? '뜻을 고르세요' : '영어 단어를 고르세요'}
        </p>
        <h3 className="text-3xl font-bold text-zinc-900 break-all leading-tight">{current.prompt}</h3>
        {current.quizType === 'en_to_ko' && current.word.pronunciation && (
          <p className="text-xl text-zinc-400">[{current.word.pronunciation}]</p>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {current.choices.map((choice) => {
          const isAnswer = choice === current.answer
          const isSelected = choice === selected
          let cls = 'w-full text-left px-6 py-5 rounded-xl border text-lg font-bold transition-all '
          if (!answered) {
            cls += 'border-sky-100 bg-white text-zinc-800 shadow hover:shadow-lg hover:border-sky-300'
          } else if (isAnswer) {
            cls += 'border-green-500 bg-green-50 text-green-700'
          } else if (isSelected) {
            cls += 'border-red-400 bg-red-50 text-red-600'
          } else {
            cls += 'border-sky-50 bg-white text-zinc-400 opacity-50'
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
          <div className={`p-4 rounded-lg text-lg font-medium ${selected === current.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <span>{selected === current.answer ? '정답입니다!' : `오답입니다. 정답: ${current.answer}`}</span>
            {current.quizType === 'ko_to_en' && current.word.pronunciation && (
              <span className="ml-2 opacity-70">[{current.word.pronunciation}]</span>
            )}
          </div>
          <div className="h-1 bg-sky-50 rounded-full overflow-hidden">
            <div
              key={selected}
              className={`h-full rounded-full ${selected === current.answer ? 'bg-green-400' : 'bg-red-400'}`}
              style={{ animation: `fill-bar ${selected === current.answer ? '1.5s' : '2.5s'} linear forwards` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
