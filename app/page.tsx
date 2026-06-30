'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from './components/Header'
import AddWordModal from './components/AddWordModal'
import WordList from './components/WordList'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import EditWordModal from './components/EditWordModal'
import QuizSetSelector from './components/QuizSetSelector'
import QuizView from './components/QuizView'
import {
  fetchVocabulary, insertWords, updateWord, deleteWord,
  fetchWordStats, upsertWordStat, resetWordStats,
  type WordStat,
} from './lib/supabase'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
}

type View = 'list' | 'quiz-sets' | 'quiz'

export default function Home() {
  const [words, setWords] = useState<Word[]>([])
  const [wordStats, setWordStats] = useState<Map<string, WordStat>>(new Map())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [quizSet, setQuizSet] = useState<{ chapter: number; question: number } | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [query, setQuery] = useState('')
  const [bookmarkOnly, setBookmarkOnly] = useState(false)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([fetchVocabulary(), fetchWordStats()]).then(([vocab, stats]) => {
      setWords(vocab)
      setWordStats(new Map(stats.map(s => [s.wordId, s])))
      setLoading(false)
    })
    try {
      const saved = localStorage.getItem('wordnote-bookmarks')
      if (saved) setBookmarked(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem('wordnote-bookmarks', JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  async function handleAddWord(entries: { word: string; meaning: string; chapter: number; question: number; pronunciation?: string }[]) {
    const newWords = entries.map(e => ({ id: crypto.randomUUID(), ...e }))
    setWords(prev => [...prev, ...newWords])
    await insertWords(newWords)
  }

  async function handleDeleteConfirm() {
    if (!deletingWord) return
    const id = deletingWord.id
    setWords(prev => prev.filter(w => w.id !== id))
    setDeletingWord(null)
    await deleteWord(id)
  }

  async function handleEditSave(updated: Word) {
    setWords(prev => prev.map(w => w.id === updated.id ? updated : w))
    setEditingWord(null)
    await updateWord(updated)
  }

  async function handleResetStats() {
    setWordStats(new Map())
    setResetKey(k => k + 1)
    await resetWordStats()
  }

  async function handleAnswer(wordId: string, word: string, meaning: string, isCorrect: boolean) {
    const updated = await upsertWordStat({ wordId, word, meaning, isCorrect })
    if (updated) {
      setWordStats(prev => new Map(prev).set(wordId, updated))
    }
  }

  function handleSelectQuizSet(chapter: number, question: number) {
    setQuizSet({ chapter, question })
    setView('quiz')
  }

  function handleStartQuiz() {
    if (selectedChapter && selectedQuestion) {
      setQuizSet({ chapter: Number(selectedChapter), question: Number(selectedQuestion) })
      setView('quiz')
    } else {
      setView('quiz-sets')
    }
  }

  const quizSetsFilterChapter = selectedChapter && !selectedQuestion ? Number(selectedChapter) : null

  const chapters = useMemo(
    () => [...new Set(words.map(w => w.chapter))].sort((a, b) => a - b),
    [words]
  )

  const questions = useMemo(() => {
    if (!selectedChapter) return []
    const ch = Number(selectedChapter)
    return [...new Set(words.filter(w => w.chapter === ch).map(w => w.question))].sort((a, b) => a - b)
  }, [words, selectedChapter])

  const filteredWords = useMemo(() => {
    let result = words
    if (selectedChapter) result = result.filter(w => w.chapter === Number(selectedChapter))
    if (selectedQuestion) result = result.filter(w => w.question === Number(selectedQuestion))
    return result
  }, [words, selectedChapter, selectedQuestion])

  const bookmarkCount = useMemo(
    () => filteredWords.filter(w => bookmarked.has(w.id)).length,
    [filteredWords, bookmarked]
  )

  const displayWords = useMemo(() => {
    const q = query.trim().toLowerCase()
    return filteredWords
      .filter(w => !bookmarkOnly || bookmarked.has(w.id))
      .filter(w => !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) || (w.pronunciation ?? '').toLowerCase().includes(q))
  }, [filteredWords, bookmarkOnly, bookmarked, query])

  function handleChapterChange(ch: string) {
    setSelectedChapter(ch)
    setSelectedQuestion('')
  }

  function handleResetView() {
    setSelectedChapter('')
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
  }

  const quizSetWords = useMemo(
    () => quizSet !== null
      ? words.filter(w => w.chapter === quizSet.chapter && w.question === quizSet.question)
      : [],
    [words, quizSet]
  )
  const chapterLabel = !quizSet ? ''
    : quizSet.chapter === 0 ? '챕터 미지정'
    : quizSet.question === 0 ? `${quizSet.chapter}챕터`
    : `${quizSet.chapter}챕터 ${quizSet.question}번`

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      {view === 'list' && (
        <Header
          onAddWord={() => setIsAddModalOpen(true)}
          onStartQuiz={handleStartQuiz}
          onResetStats={handleResetStats}
          onResetView={handleResetView}
          chapters={chapters}
          questions={questions}
          selectedChapter={selectedChapter}
          selectedQuestion={selectedQuestion}
          onChapterChange={handleChapterChange}
          onQuestionChange={setSelectedQuestion}
          query={query}
          setQuery={setQuery}
          bookmarkOnly={bookmarkOnly}
          setBookmarkOnly={setBookmarkOnly}
          bookmarkCount={bookmarkCount}
        />
      )}
      <main className="flex flex-col flex-1 bg-white">
        {view === 'list' && (
          loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-600 py-32">
              <p className="text-sm">단어를 불러오는 중...</p>
            </div>
          ) : (
            <WordList
              words={displayWords}
              wordStats={wordStats}
              onDelete={(id) => setDeletingWord(words.find(w => w.id === id) ?? null)}
              onEdit={(word) => setEditingWord(word)}
              resetKey={resetKey}
              bookmarked={bookmarked}
              onToggleBookmark={toggleBookmark}
              bookmarkOnly={bookmarkOnly}
              hasAnyWords={words.length > 0}
            />
          )
        )}
        {view === 'quiz-sets' && (
          <QuizSetSelector
            words={words}
            filterChapter={quizSetsFilterChapter}
            onSelect={handleSelectQuizSet}
            onBack={() => setView('list')}
          />
        )}
        {view === 'quiz' && quizSet !== null && (
          <QuizView
            setWords={quizSetWords}
            allWords={words}
            chapterLabel={chapterLabel}
            onAnswer={handleAnswer}
            onBack={() => setView('quiz-sets')}
          />
        )}
      </main>

      {isAddModalOpen && (
        <AddWordModal
          onSave={handleAddWord}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
      {deletingWord && (
        <DeleteConfirmModal
          word={deletingWord.word}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingWord(null)}
        />
      )}
      {editingWord && (
        <EditWordModal
          word={editingWord}
          onSave={handleEditSave}
          onCancel={() => setEditingWord(null)}
        />
      )}
    </div>
  )
}
