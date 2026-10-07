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
const SPAWN_MS = 600 // 하트 수명(1.8초) ÷ 간격 ≈ 동시에 3개
const MAX_HEARTS = 3

interface Heart {
  key: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
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
      const heart: Heart = {
        key: nextKey.current++,
        // 머리 위쪽에서 오른쪽 위로 살짝 비켜 나와서
        x: p.x + rand(10, 50),
        y: p.y - rand(20, 50),
        // 짧게 오른쪽 위로 떠오르며 커지면서 사라진다
        dx: rand(50, 110),
        dy: rand(-150, -90),
        size: rand(22, 34),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      }
      setHearts(prev => [...prev, heart].slice(-MAX_HEARTS))
    }

    const first = setTimeout(spawn, 50)
    const id = setInterval(spawn, SPAWN_MS)
    return () => {
      clearTimeout(first)
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
            animation: 'heart-pop 1.8s ease-out both',
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  )
}
