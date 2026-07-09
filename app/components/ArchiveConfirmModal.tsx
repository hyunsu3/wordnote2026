'use client'

interface ArchiveConfirmModalProps {
  count: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ArchiveConfirmModal({ count, onConfirm, onCancel }: ArchiveConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">단어 보관</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            현재 선택된 범위의 단어 <span className="font-semibold text-zinc-800 dark:text-zinc-200">{count}개</span>를 보관 처리할까요? 단어세트 목록에서 보이지 않게 되며, 보관함에서 언제든 복원할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            보관 처리
          </button>
        </div>
      </div>
    </div>
  )
}
