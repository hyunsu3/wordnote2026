'use client'

import { useRef, useState } from 'react'

const DELETE_PASSWORD = '0621'

interface DeleteConfirmModalProps {
  word: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ word, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleConfirm() {
    if (pw === DELETE_PASSWORD) {
      onConfirm()
    } else {
      setError(true)
      setPw('')
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">단어 삭제</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{word}</span>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            autoFocus
            type="password"
            inputMode="numeric"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(false) }}
            onKeyDown={handleKeyDown}
            placeholder="삭제 비밀번호"
            className={`w-full px-3 py-2 rounded-lg border text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm ${error ? 'border-red-400 bg-red-50' : 'border-sky-200 bg-sky-50'}`}
          />
          {error && <p className="text-sm text-red-500">비밀번호가 틀렸습니다.</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pw}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors dark:bg-red-500 dark:hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
