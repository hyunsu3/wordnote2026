'use client'

import { useState, useEffect, useMemo } from 'react'
import Header from './components/Header'
import AddWordModal from './components/AddWordModal'
import WordList from './components/WordList'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import EditWordModal from './components/EditWordModal'
import QuizSetSelector from './components/QuizSetSelector'
import QuizView from './components/QuizView'
import {
  fetchVocabulary, insertWords, updateWord, deleteWord,
  fetchWordStats, upsertWordStat,
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
  const [quizChapter, setQuizChapter] = useState<number | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)

  useEffect(() => {
    Promise.all([fetchVocabulary(), fetchWordStats()]).then(([vocab, stats]) => {
      setWords(vocab)
      setWordStats(new Map(stats.map(s => [s.wordId, s])))
      setLoading(false)
    })
  }, [])

  async function handleAddWord(entries: { word: string; meaning: string; chapter: number; question: number }[]) {
    const newWords = entries.map(e => ({ id: crypto.randomUUID(), ...e }))
    setWords(prev => [...prev, ...newWords])
    setIsAddModalOpen(false)
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

  async function handleAnswer(wordId: string, word: string, meaning: string, isCorrect: boolean) {
    const updated = await upsertWordStat({ wordId, word, meaning, isCorrect })
    if (updated) {
      setWordStats(prev => new Map(prev).set(wordId, updated))
    }
  }

  function handleSelectQuizSet(chapter: number) {
    setQuizChapter(chapter)
    setView('quiz')
  }

  const quizSetWords = useMemo(
    () => quizChapter !== null ? words.filter(w => w.chapter === quizChapter) : [],
    [words, quizChapter]
  )
  const chapterLabel = quizChapter === 0 ? '챕터 미지정' : `${quizChapter}챕터`

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {view === 'list' && (
        <Header
          onAddWord={() => setIsAddModalOpen(true)}
          onStartQuiz={() => setView('quiz-sets')}
        />
      )}
      <main className="flex flex-col flex-1">
        {view === 'list' && (
          loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-zinc-400 dark:text-zinc-600 py-32">
              <p className="text-sm">단어를 불러오는 중...</p>
            </div>
          ) : (
            <WordList
              words={words}
              wordStats={wordStats}
              onDelete={(id) => setDeletingWord(words.find(w => w.id === id) ?? null)}
              onEdit={(word) => setEditingWord(word)}
            />
          )
        )}
        {view === 'quiz-sets' && (
          <QuizSetSelector
            words={words}
            onSelect={handleSelectQuizSet}
            onBack={() => setView('list')}
          />
        )}
        {view === 'quiz' && quizChapter !== null && (
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
          onCancel={() => setIsAddModalOpen(false)}
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
