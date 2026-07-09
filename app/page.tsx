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
  fetchBookmarks, setBookmark, incrementTapStat, setArchived,
  type WordStat,
} from './lib/supabase'
import ArchiveConfirmModal from './components/ArchiveConfirmModal'
import ArchivedSetsModal from './components/ArchivedSetsModal'
import DictionaryView from './components/DictionaryView'

interface Word {
  id: string
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  wordSet?: string
  archived: boolean
  example?: string
  synonym?: string
  antonym?: string
}

type View = 'list' | 'quiz-sets' | 'quiz' | 'dictionary'

function findLatestStudyScope(vocab: Word[], stats: WordStat[]): { wordSet?: string; chapter: number } | null {
  let latestTime = ''
  let latestWord: Word | null = null
  for (const s of stats) {
    if (!s.lastStudied || s.lastStudied <= latestTime) continue
    if (s.correctCount + s.wrongCount === 0) continue
    const w = vocab.find(v => v.id === s.wordId)
    if (!w) continue
    latestTime = s.lastStudied
    latestWord = w
  }
  return latestWord ? { wordSet: latestWord.wordSet, chapter: latestWord.chapter } : null
}

function resolveStudyScope(vocab: Word[], stats: WordStat[]): { wordSet?: string; chapter: number } | null {
  const latest = findLatestStudyScope(vocab, stats)
  if (latest) return latest
  const chapters = vocab.filter(w => !w.archived).map(w => w.chapter)
  if (chapters.length === 0) return null
  const realChapters = chapters.filter(ch => ch > 0)
  const chapter = realChapters.length > 0 ? Math.min(...realChapters) : Math.min(...chapters)
  return { wordSet: undefined, chapter }
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([])
  const [wordStats, setWordStats] = useState<Map<string, WordStat>>(new Map())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [quizSet, setQuizSet] = useState<{ chapter: number; question: number } | null>(null)
  const [selectedWordSet, setSelectedWordSet] = useState<string>('')
  const [selectedChapter, setSelectedChapter] = useState<string>('')
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [studySecondsLeft, setStudySecondsLeft] = useState<number | null>(null)
  const [studyPaused, setStudyPaused] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false)
  const [isArchivedSetsOpen, setIsArchivedSetsOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const [query, setQuery] = useState('')
  const [bookmarkOnly, setBookmarkOnly] = useState(false)
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([fetchVocabulary(), fetchWordStats(), fetchBookmarks()]).then(([vocab, stats, bookmarkIds]) => {
      setWords(vocab)
      setWordStats(new Map(stats.map(s => [s.wordId, s])))
      setBookmarked(new Set(bookmarkIds))

      const latest = resolveStudyScope(vocab, stats)
      if (latest) {
        if (latest.wordSet) setSelectedWordSet(latest.wordSet)
        setSelectedChapter(String(latest.chapter))
      }

      setLoading(false)
    })
  }, [])

  const toggleBookmark = useCallback((id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      const isNowBookmarked = !next.has(id)
      isNowBookmarked ? next.add(id) : next.delete(id)
      setBookmark(id, isNowBookmarked)
      return next
    })
  }, [])

  async function handleAddWord(entries: { word: string; meaning: string; chapter: number; question: number; pronunciation?: string; wordSet?: string }[]) {
    const newWords = entries.map(e => ({ id: crypto.randomUUID(), archived: false, ...e }))
    setWords(prev => [...prev, ...newWords])
    await insertWords(newWords)
  }

  async function handleArchive() {
    const ids = filteredWords.map(w => w.id)
    if (ids.length === 0) return
    setWords(prev => prev.map(w => ids.includes(w.id) ? { ...w, archived: true } : w))
    setIsArchiveConfirmOpen(false)
    await setArchived(ids, true)
  }

  async function handleRestore(wordSet: string | undefined, chapter: number, question: number) {
    const ids = archivedWords
      .filter(w => (w.wordSet ?? '') === (wordSet ?? '') && w.chapter === chapter && w.question === question)
      .map(w => w.id)
    if (ids.length === 0) return
    setWords(prev => prev.map(w => ids.includes(w.id) ? { ...w, archived: false } : w))
    await setArchived(ids, false)
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

  const isInResetScope = useCallback((w: Word) =>
    (!selectedWordSet || w.wordSet === selectedWordSet) &&
    (!selectedChapter || w.chapter === Number(selectedChapter)),
    [selectedWordSet, selectedChapter]
  )

  async function handleReset(clearBookmarksToo: boolean) {
    const targetIds = words.filter(isInResetScope).map(w => w.id)
    let nextStats = wordStats
    if (targetIds.length > 0) {
      nextStats = new Map(wordStats)
      targetIds.forEach(id => nextStats.delete(id))
      setWordStats(nextStats)
      setResetKey(k => k + 1)
    }

    const bookmarkTargets = clearBookmarksToo
      ? words.filter(w => bookmarked.has(w.id) && isInResetScope(w))
      : []
    if (bookmarkTargets.length > 0) {
      setBookmarked(prev => {
        const next = new Set(prev)
        bookmarkTargets.forEach(w => next.delete(w.id))
        return next
      })
    }

    setStudySecondsLeft(null)
    setStudyPaused(false)
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
    const latest = resolveStudyScope(words, Array.from(nextStats.values()))
    setSelectedWordSet(latest?.wordSet ?? '')
    setSelectedChapter(latest ? String(latest.chapter) : '')

    if (targetIds.length > 0) await resetWordStats(targetIds)
    if (bookmarkTargets.length > 0) await Promise.all(bookmarkTargets.map(w => setBookmark(w.id, false)))
  }

  async function handleAnswer(wordId: string, word: string, meaning: string, isCorrect: boolean) {
    const updated = await upsertWordStat({ wordId, word, meaning, isCorrect })
    if (updated) {
      setWordStats(prev => {
        const cur = prev.get(wordId)
        return new Map(prev).set(wordId, { ...updated, tapCount: cur?.tapCount ?? 0 })
      })
    }
  }

  async function handleTap(wordId: string, word: string, meaning: string) {
    const { tapCount: newTap, lastStudied } = await incrementTapStat({ wordId, word, meaning })
    setWordStats(prev => {
      const cur = prev.get(wordId)
      const next = new Map(prev)
      next.set(wordId, cur
        ? { ...cur, tapCount: newTap, lastStudied }
        : { wordId, correctCount: 0, wrongCount: 0, lastStudied, tapCount: newTap }
      )
      return next
    })
  }

  function handleSelectQuizSet(chapter: number, question: number) {
    setStudySecondsLeft(null)
    setStudyPaused(false)
    setQuizSet({ chapter, question })
    setView('quiz')
  }

  function handleQuizGoToList() {
    if (quizSet) {
      setSelectedChapter(String(quizSet.chapter))
      setSelectedQuestion(String(quizSet.question))
    }
    setView('list')
  }

  function handleStartQuiz() {
    setStudySecondsLeft(null)
    setStudyPaused(false)
    if (selectedChapter && selectedQuestion) {
      setQuizSet({ chapter: Number(selectedChapter), question: Number(selectedQuestion) })
      setView('quiz')
      return
    }

    const candidates = selectedChapter
      ? wordSetFilteredWords.filter(w => w.chapter === Number(selectedChapter))
      : wordSetFilteredWords
    const groupKeys = new Set(candidates.map(w => `${w.chapter}-${w.question}`))

    if (groupKeys.size === 1) {
      const [chapter, question] = [...groupKeys][0].split('-').map(Number)
      setQuizSet({ chapter, question })
      setView('quiz')
    } else {
      setView('quiz-sets')
    }
  }

  const STUDY_DURATION_SECONDS = 600

  function handleToggleStudy() {
    if (studySecondsLeft !== null) {
      setStudyPaused(p => !p)
    } else {
      setView('list')
      setStudySecondsLeft(STUDY_DURATION_SECONDS)
      setStudyPaused(false)
    }
  }

  useEffect(() => {
    if (studySecondsLeft === null || studySecondsLeft <= 0 || studyPaused) return
    const timer = setTimeout(() => setStudySecondsLeft(s => (s !== null ? s - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [studySecondsLeft, studyPaused])

  useEffect(() => {
    if (studySecondsLeft === 0) handleStartQuiz()
  }, [studySecondsLeft])

  const quizSetsFilterChapter = selectedChapter && !selectedQuestion ? Number(selectedChapter) : null

  const visibleWords = useMemo(() => words.filter(w => !w.archived), [words])
  const archivedWords = useMemo(() => words.filter(w => w.archived), [words])

  const wordSets = useMemo(
    () => [...new Set(visibleWords.map(w => w.wordSet).filter((v): v is string => !!v))],
    [visibleWords]
  )

  const wordSetFilteredWords = useMemo(
    () => selectedWordSet ? visibleWords.filter(w => w.wordSet === selectedWordSet) : visibleWords,
    [visibleWords, selectedWordSet]
  )

  const chapters = useMemo(
    () => [...new Set(wordSetFilteredWords.map(w => w.chapter))].sort((a, b) => a - b),
    [wordSetFilteredWords]
  )

  const questions = useMemo(() => {
    if (!selectedChapter) return []
    const ch = Number(selectedChapter)
    return [...new Set(wordSetFilteredWords.filter(w => w.chapter === ch).map(w => w.question))].sort((a, b) => a - b)
  }, [wordSetFilteredWords, selectedChapter])

  const filteredWords = useMemo(() => {
    let result = wordSetFilteredWords
    if (selectedChapter) result = result.filter(w => w.chapter === Number(selectedChapter))
    if (selectedQuestion) result = result.filter(w => w.question === Number(selectedQuestion))
    return result
  }, [wordSetFilteredWords, selectedChapter, selectedQuestion])

  const bookmarkCount = useMemo(
    () => visibleWords.filter(w => bookmarked.has(w.id)).length,
    [visibleWords, bookmarked]
  )

  const displayWords = useMemo(() => {
    const q = query.trim().toLowerCase()
    const searchingFullPool = bookmarkOnly || q.length > 0
    const base = searchingFullPool ? visibleWords : filteredWords
    const result = base
      .filter(w => !bookmarkOnly || bookmarked.has(w.id))
      .filter(w => !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) || (w.pronunciation ?? '').toLowerCase().includes(q))

    if (q) {
      const score = (w: Word) => {
        const word = w.word.toLowerCase()
        const meaning = w.meaning.toLowerCase()
        const pron = (w.pronunciation ?? '').toLowerCase()
        if (word === q) return 0
        if (word.startsWith(q)) return 1
        if (meaning.startsWith(q)) return 2
        if (word.includes(q)) return 3
        if (meaning.includes(q)) return 4
        if (pron.includes(q)) return 5
        return 6
      }
      return [...result].sort((a, b) => score(a) - score(b))
    }
    if (bookmarkOnly) {
      return [...result].sort((a, b) => a.chapter - b.chapter || a.question - b.question)
    }
    return [...result].sort((a, b) => a.word.localeCompare(b.word))
  }, [filteredWords, visibleWords, bookmarkOnly, bookmarked, query])

  function handleWordSetChange(ws: string) {
    setSelectedWordSet(ws)
    setSelectedChapter('')
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
  }

  function handleChapterChange(ch: string) {
    setSelectedChapter(ch)
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
  }

  function handleBackFromDictionary() {
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
    const latest = resolveStudyScope(words, Array.from(wordStats.values()))
    setSelectedWordSet(latest?.wordSet ?? '')
    setSelectedChapter(latest ? String(latest.chapter) : '')
    setView('list')
  }

  function handleResetView() {
    setStudySecondsLeft(null)
    setStudyPaused(false)
    setSelectedQuestion('')
    setQuery('')
    setBookmarkOnly(false)
    const latest = resolveStudyScope(words, Array.from(wordStats.values()))
    setSelectedWordSet(latest?.wordSet ?? '')
    setSelectedChapter(latest ? String(latest.chapter) : '')
  }

  const quizSetWords = useMemo(
    () => quizSet !== null
      ? wordSetFilteredWords.filter(w => w.chapter === quizSet.chapter && w.question === quizSet.question)
      : [],
    [wordSetFilteredWords, quizSet]
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
          onToggleStudy={handleToggleStudy}
          isStudying={studySecondsLeft !== null}
          isStudyPaused={studyPaused}
          studySecondsLeft={studySecondsLeft}
          onReset={handleReset}
          onResetView={handleResetView}
          wordSets={wordSets}
          selectedWordSet={selectedWordSet}
          onWordSetChange={handleWordSetChange}
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
          canArchive={filteredWords.length > 0 && (selectedWordSet !== '' || selectedChapter !== '' || selectedQuestion !== '')}
          onArchive={() => setIsArchiveConfirmOpen(true)}
          archivedCount={archivedWords.length}
          onOpenArchived={() => setIsArchivedSetsOpen(true)}
          onOpenDictionary={() => setView('dictionary')}
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
              hasAnyWords={visibleWords.length > 0}
              onTap={handleTap}
            />
          )
        )}
        {view === 'quiz-sets' && (
          <QuizSetSelector
            words={wordSetFilteredWords}
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
            onGoToList={handleQuizGoToList}
          />
        )}
        {view === 'dictionary' && (
          <DictionaryView
            words={words}
            onBack={handleBackFromDictionary}
          />
        )}
      </main>

      {isAddModalOpen && (
        <AddWordModal
          onSave={handleAddWord}
          onClose={() => setIsAddModalOpen(false)}
          defaultChapter={selectedChapter ? Number(selectedChapter) : undefined}
          defaultQuestion={selectedQuestion ? Number(selectedQuestion) : undefined}
          defaultWordSet={selectedWordSet || undefined}
          wordSets={wordSets}
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
          wordSets={wordSets}
        />
      )}
      {isArchiveConfirmOpen && (
        <ArchiveConfirmModal
          count={filteredWords.length}
          onConfirm={handleArchive}
          onCancel={() => setIsArchiveConfirmOpen(false)}
        />
      )}
      {isArchivedSetsOpen && (
        <ArchivedSetsModal
          archivedWords={archivedWords}
          onRestore={handleRestore}
          onClose={() => setIsArchivedSetsOpen(false)}
        />
      )}
    </div>
  )
}
