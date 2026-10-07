'use client'

import { useEffect, useRef, useState } from 'react'

// bg.webp(1920x1081) 안에서 두 캐릭터(치이카와, 하치와레) 머리 위쪽 위치 (이미지 비율)
const IMG_W = 1920
const IMG_H = 1081
const CHARACTERS = [
  { fx: 0.165, fy: 0.6 },
  { fx: 0.295, fy: 0.665 },
]
const EMOJIS = ['❤️', '💕', '💗', '💖']
const SPAWN_MS = 600 // 하트 수명(약 1.8초) ÷ 간격 ≈ 동시에 3개
const EMIT_MS = 3500 // 맨 아래에 닿은 뒤 하트를 내보내는 시간 (그 뒤엔 멈춤)
const MAX_HEARTS = 3

interface Heart {
  key: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  duration: number
  emoji: string
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// AppBackground와 같은 배치 규칙: 넓은 화면은 cover + left-bottom, 모바일은 높이 90% + left-bottom
function characterPosition(fx: number, fy: number, vw: number, vh: number) {
  const mobile = vw < 640
  const scale = mobile ? (vh * 0.9) / IMG_H : Math.max(vw / IMG_W, vh / IMG_H)
  return { x: IMG_W * scale * fx, y: vh - IMG_H * scale * (1 - fy) }
}

// 스크롤이 맨 아래에 닿으면 캐릭터들이 하트를 화면(나)을 향해 쏘아 보낸다
export default function CharacterHearts({ enabled }: { enabled: boolean }) {
  const [atBottom, setAtBottom] = useState(false)
  const [hearts, setHearts] = useState<Heart[]>([])
  const nextKey = useRef(0)
  const turn = useRef(0)
  const active = enabled && atBottom

  useEffect(() => {
    const check = () => {
      const el = document.documentElement
      setAtBottom(el.scrollHeight > window.innerHeight + 40 && window.scrollY + window.innerHeight >= el.scrollHeight - 8)
    }
    const raf = requestAnimationFrame(check)
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // 한 번에 하트 하나씩, 두 캐릭터가 번갈아 내보낸다
    const spawn = () => {
      const c = CHARACTERS[turn.current++ % CHARACTERS.length]
      const p = characterPosition(c.fx, c.fy, window.innerWidth, window.innerHeight)
      // 오른쪽(10°)부터 왼쪽 위(130°)까지 하트마다 다른 방향으로, 거리도 제각각 짧게
      const angle = (rand(10, 130) * Math.PI) / 180
      const dist = rand(70, 170)
      const heart: Heart = {
        key: nextKey.current++,
        // 머리에서 살짝 떨어진 위쪽·오른쪽에서 시작
        x: p.x + rand(0, 50),
        y: p.y - rand(20, 60),
        dx: Math.cos(angle) * dist,
        dy: -Math.sin(angle) * dist,
        size: rand(20, 36),
        duration: rand(1.5, 2.1),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      }
      setHearts(prev => [...prev, heart].slice(-MAX_HEARTS))
    }

    const first = setTimeout(spawn, 50)
    const id = setInterval(spawn, SPAWN_MS)
    const stop = setTimeout(() => clearInterval(id), EMIT_MS)
    return () => {
      clearTimeout(first)
      clearTimeout(stop)
      clearInterval(id)
    }
  }, [active])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {hearts.map(h => (
        <span
          key={h.key}
          onAnimationEnd={() => setHearts(prev => prev.filter(x => x.key !== h.key))}
          className="absolute select-none"
          style={{
            left: h.x,
            top: h.y,
            fontSize: h.size,
            ['--dx' as string]: `${h.dx}px`,
            ['--dy' as string]: `${h.dy}px`,
            animation: `heart-pop ${h.duration}s ease-out both`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  )
}
