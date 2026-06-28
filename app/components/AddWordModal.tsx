'use client'

import { useRef, useState } from 'react'

interface WordEntry {
  word: string
  meaning: string
  chapter: number
  question: number
  pronunciation?: string
}

interface AddWordModalProps {
  onSave: (entries: WordEntry[]) => void
  onCancel: () => void
}

type Tab = 'manual' | 'csv'

function parseCSV(text: string): WordEntry[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  const entries: WordEntry[] = []

  for (const line of lines) {
    // simple quoted-field CSV split
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

    const [word, meaning, chapter, question] = cols
    if (!word || !meaning) continue
    // skip header row
    if (word.toLowerCase() === '단어' || word.toLowerCase() === 'word') continue

    entries.push({
      word,
      meaning,
      chapter: Number(chapter) || 0,
      question: Number(question) || 0,
    })
  }
  return entries
}

export default function AddWordModal({ onSave, onCancel }: AddWordModalProps) {
  const [tab, setTab] = useState<Tab>('manual')
  const [form, setForm] = useState({ word: '', meaning: '', pronunciation: '', chapter: '', question: '' })
  const [csvEntries, setCsvEntries] = useState<WordEntry[] | null>(null)
  const [csvFileName, setCsvFileName] = useState('')
  const submittingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    }])
    submittingRef.current = false
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleManualSubmit()
    if (e.key === 'Escape') onCancel()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setCsvEntries(parseCSV(text))
    }
    reader.readAsText(file, 'utf-8')
  }

  function handleCSVSave() {
    if (!csvEntries || csvEntries.length === 0) return
    onSave(csvEntries)
  }

  const tabClass = (t: Tab) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">단어 추가</h2>

        {/* tab switcher */}
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button className={tabClass('manual')} onClick={() => setTab('manual')}>직접 입력</button>
          <button className={tabClass('csv')} onClick={() => setTab('csv')}>CSV 업로드</button>
        </div>

        {tab === 'manual' ? (
          <>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                name="word"
                value={form.word}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="단어"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
              />
              <input
                name="meaning"
                value={form.meaning}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="뜻"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
              />
              <input
                name="pronunciation"
                value={form.pronunciation}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="발음 (선택, 예: ɪnˈtɜːrprɪt)"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
              />
              <div className="flex gap-2">
                <input
                  name="chapter"
                  type="number"
                  min={0}
                  value={form.chapter}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="챕터 번호"
                  className="w-1/2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
                />
                <input
                  name="question"
                  type="number"
                  min={0}
                  value={form.question}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="문항 번호"
                  className="w-1/2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                취소
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!form.word.trim() || !form.meaning.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                저장
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                CSV 형식: <span className="font-mono">단어,뜻,챕터번호,문항번호</span>
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full px-3 py-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 transition-colors text-sm"
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
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                취소
              </button>
              <button
                onClick={handleCSVSave}
                disabled={!csvEntries || csvEntries.length === 0}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
