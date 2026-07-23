'use client'

import { useEffect, useState } from 'react'
import { fetchProfileNames, verifyProfilePin, type Profile } from '../lib/supabase'

interface ProfileGateProps {
  onLogin: (profile: Profile) => void
}

export default function ProfileGate({ onLogin }: ProfileGateProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfileNames().then(setProfiles)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || pin.length !== 6) return
    setLoading(true)
    setError('')
    const profile = await verifyProfilePin(selected.name, pin)
    setLoading(false)
    if (profile) {
      onLogin(profile)
    } else {
      setError('비밀번호가 틀렸습니다.')
      setPin('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-white px-4">
      <h1 className="text-2xl font-bold text-zinc-900">보카보카</h1>
      {!selected ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-center text-zinc-500 text-sm mb-1">프로필을 선택하세요</p>
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setError('') }}
              className="px-4 py-3 rounded-xl border border-sky-200 bg-white text-lg font-medium text-zinc-800 hover:bg-sky-50 hover:border-sky-400 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-center text-zinc-500 text-sm mb-1">{selected.name}님, 비밀번호 6자리를 입력하세요</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
            className="px-4 py-3 rounded-xl border border-sky-200 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-sky-400"
            placeholder="••••••"
          />
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={pin.length !== 6 || loading}
            className="px-4 py-3 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 disabled:opacity-40 transition-colors"
          >
            {loading ? '확인 중...' : '확인'}
          </button>
          <button
            type="button"
            onClick={() => { setSelected(null); setPin(''); setError('') }}
            className="text-sm text-zinc-400 hover:text-zinc-600"
          >
            다른 프로필 선택
          </button>
        </form>
      )}
    </div>
  )
}
