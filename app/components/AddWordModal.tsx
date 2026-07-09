'use client'

import { useRef, useState } from 'react'

interface WordEntry {
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
  wordSet?: string
}

interface AddWordModalProps {
  onSave: (entries: WordEntry[]) => void
  onClose: () => void
  defaultChapter?: number
  defaultQuestion?: number
  defaultWordSet?: string
  wordSets: string[]
}

type Tab = 'manual' | 'csv'

function parseCSV(text: string, defaultWordSet?: string): WordEntry[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  const entries: WordEntry[] = []

  for (const line of lines) {
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    cols.push(cur.trim())

    const [word, meaning, chapter, question, wordSet] = cols
    if (!word || !meaning) continue
    if (word.toLowerCase() === '단어' || word.toLowerCase() === 'word') continue

    entries.push({
      word,
      meaning,
      chapter: Number(chapter) || 0,
      question: Number(question) || 0,
      wordSet: wordSet || defaultWordSet || undefined,
    })
  }
  return entries
}

export default function AddWordModal({ onSave, onClose, defaultChapter, defaultQuestion, defaultWordSet, wordSets }: AddWordModalProps) {
  const [tab, setTab] = useState<Tab>('manual')
  const [form, setForm] = useState({
    word: '', meaning: '', pronunciation: '',
    chapter: defaultChapter ? String(defaultChapter) : '',
    question: defaultQuestion ? String(defaultQuestion) : '',
    wordSet: defaultWordSet ?? '',
  })
  const [csvEntries, setCsvEntries] = useState<WordEntry[] | null>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const submittingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const wordInputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleManualSubmit() {
    if (submittingRef.current) return
    if (!form.word.trim() || !form.meaning.trim()) return
    submittingRef.current = true
    onSave([{
      word: form.word.trim(),
      meaning: form.meaning.trim(),
      pronunciation: form.pronunciation.trim() || undefined,
      chapter: Number(form.chapter) || 0,
      question: Number(form.question) || 0,
      wordSet: form.wordSet.trim() || undefined,
    }])
    // 세트·챕터·문항번호 유지, 단어·뜻·발음만 초기화
    setForm(prev => ({ ...prev, word: '', meaning: '', pronunciation: '' }))
    submittingRef.current = false
    setTimeout(() => wordInputRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleManualSubmit()
    if (e.key === 'Escape') onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const bytes = new Uint8Array(buffer)
      const hasUtf8Bom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF
      // BOM 없는 CSV는 엑셀이 한글 Windows 기본 인코딩(EUC-KR/CP949)으로 저장한 경우가 많음
      const text = new TextDecoder(hasUtf8Bom ? 'utf-8' : 'euc-kr').decode(buffer)
      setCsvEntries(parseCSV(text, defaultWordSet))
    }
    reader.readAsArrayBuffer(file)
  }

  function handleCSVSave() {
    if (!csvEntries || csvEntries.length === 0) return
    onSave(csvEntries)
    onClose()
  }

  function handleDownloadTemplate() {
    const header = '단어,뜻,챕터번호,문항번호,단어세트\n'
    const blob = new Blob(['﻿' + header], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '단어_추가_양식.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabClass = (t: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? 'bg-sky-500 text-white'
        : 'text-sky-400 hover:text-sky-600 hover:bg-sky-50'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">단어 추가</h2>

        <div className="flex gap-1 p-1 bg-sky-50 border border-sky-100 rounded-xl">
          <button className={tabClass('manual')} onClick={() => setTab('manual')}>직접 입력</button>
          <button className={tabClass('csv')} onClick={() => setTab('csv')}>CSV 업로드</button>
        </div>

        {tab === 'manual' ? (
          <>
            <div className="flex flex-col gap-3">
              <input
                ref={wordInputRef}
                autoFocus
                name="word"
                value={form.word}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="단어"
                className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
              <input
                name="meaning"
                value={form.meaning}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="뜻"
                className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
              <input
                name="pronunciation"
                value={form.pronunciation}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="발음 (선택, 예: ɪnˈtɜːrprɪt)"
                className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
              <input
                name="wordSet"
                list="word-set-options"
                value={form.wordSet ?? ''}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="단어 세트 (선택, 예: 기말3-1)"
                className="w-full px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
              />
              <datalist id="word-set-options">
                {wordSets.map(ws => <option key={ws} value={ws} />)}
              </datalist>
              <div className="flex gap-2">
                <input
                  name="chapter"
                  type="number"
                  min={0}
                  value={form.chapter}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="챕터 번호"
                  className="w-1/2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                />
                <input
                  name="question"
                  type="number"
                  min={0}
                  value={form.question}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="문항 번호"
                  className="w-1/2 px-3 py-2 rounded-lg border border-sky-200 bg-sky-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!form.word.trim() || !form.meaning.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                저장
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                CSV 형식: <span className="font-mono">단어,뜻,챕터번호,문항번호,단어세트(선택)</span>
                {defaultWordSet && <><br />단어세트를 비워두면 현재 선택된 <span className="font-medium text-zinc-700 dark:text-zinc-300">&apos;{defaultWordSet}&apos;</span> 세트로 저장됩니다.</>}
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="self-start text-xs font-medium text-sky-500 hover:text-sky-700 underline underline-offset-2 transition-colors"
              >
                빈 CSV 양식 다운로드
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full px-3 py-6 rounded-xl border-2 border-dashed border-sky-200 text-sky-400 hover:border-sky-400 hover:text-sky-600 transition-colors text-sm"
              >
                {csvFileName ? (
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{csvFileName}</span>
                ) : (
                  <span>클릭하여 .csv 파일 선택</span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {csvEntries !== null && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{csvEntries.length}개</span>의 단어가 파싱되었습니다.
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCSVSave}
                disabled={!csvEntries || csvEntries.length === 0}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                업로드
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
