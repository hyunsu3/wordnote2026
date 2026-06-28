'use client'

interface DeleteConfirmModalProps {
  word: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmModal({ word, onConfirm, onCancel }: DeleteConfirmModalProps) {
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
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors dark:bg-red-500 dark:hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
