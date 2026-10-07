'use client'

import { useEffect, useRef, useState } from 'react'

// bg.webp(1920x1081) 안에서 두 캐릭터(치이카와, 하치와레) 머리 위쪽 위치 (이미지 비율)
const IMG_W = 1920
const IMG_H = 1081
const CHARACTERS = [
  { fx: 0.165, fy: 0.6, away: 12, right: 0 }, // 치이카와 — away: 머리에서 추가로 띄우는 거리(px), right: 오른쪽으로 옮기는 거리(px)
  { fx: 0.295, fy: 0.665, away: 0, right: 35 }, // 하치와레
]
// 두 캐릭터 몸통(누르는 영역) 중심과 반지름 (이미지 기준 px) — CHARACTERS와 같은 순서
const BODIES = [
  { x: 320, y: 768, r: 130 }, // 치이카와
  { x: 585, y: 835, r: 130 }, // 하치와레
]
const EMOJIS = ['❤️', '💕', '💗', '💖']
const HOLD_SPAWN_MS = 250 // 캐릭터를 누르고 있을 때 하트 간격 (더 빠르게)
const MAX_HEARTS = 8

interface Heart {
  key: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  duration: number
  delay: number // 시작 지연(초) — 두 캐릭터가 살짝 어긋나게
  sway: number // 좌우 흔들림 폭(px)
  tilt: number // 기울기(deg)
  swayDuration: number // 한 번 흔들리는 시간(초)
  emoji: string
}

interface HitArea {
  x: number
  y: number
  r: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

// AppBackground와 같은 배치 규칙: 넓은 화면은 cover + left-bottom, 모바일은 높이 90% + left-bottom
function backgroundScale(vw: number, vh: number) {
  return vw < 640 ? (vh * 0.9) / IMG_H : Math.max(vw / IMG_W, vh / IMG_H)
}

function toScreen(imgX: number, imgY: number, vw: number, vh: number) {
  const scale = backgroundScale(vw, vh)
  return { x: imgX * scale, y: vh - (IMG_H - imgY) * scale, scale }
}

function makeHeart(key: number, characterIndex: number, delay: number): Heart {
  const c = CHARACTERS[characterIndex]
  const p = toScreen(IMG_W * c.fx, IMG_H * c.fy, window.innerWidth, window.innerHeight)
  // 오른쪽(10°)부터 왼쪽 위(130°)까지 하트마다 다른 방향으로, 거리도 제각각 짧게
  const angle = (rand(10, 130) * Math.PI) / 180
  const dist = rand(70, 170)
  return {
    key,
    // 머리에서 살짝 떨어진 위쪽·오른쪽에서 시작
    x: p.x + rand(0, 50) + c.away * 0.5 + c.right,
    y: p.y - rand(20, 60) - c.away,
    dx: Math.cos(angle) * dist,
    dy: -Math.sin(angle) * dist,
    size: rand(20, 36),
    duration: rand(1.5, 2.1),
    delay,
    sway: rand(4, 9),
    tilt: rand(5, 10),
    swayDuration: rand(0.8, 1.2),
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  }
}

const BUBBLE_WIDTH = 84 // 말풍선 폭(px) — 오른쪽 공간이 이보다 좁으면 머리 위에 표시
const BUBBLE_HEIGHT = 50 // 두 줄 기준 높이(px)
const BUBBLE_BORDER = '#6b4f45' // 치이카와 외곽선의 진한 갈색

// 하치와레의 말풍선: 오른쪽 공간이 있으면 옆에, 좁은 화면이면 머리 위에 꼬리를 아래로 두고 표시
function Hint({ hit, hidden }: { hit: HitArea; hidden: boolean }) {
  const vw = window.innerWidth
  // 하치와레 몸은 중심에서 반지름의 약 1.05배, 머리 꼭대기(귀)는 위로 약 1.3배까지 차지한다 → 그 바깥에 둔다
  const besideLeft = hit.x + hit.r * 1.1 + 12
  const beside = vw - besideLeft >= BUBBLE_WIDTH + 8

  const left = beside ? besideLeft : Math.min(Math.max(hit.x - BUBBLE_WIDTH / 2, 8), vw - BUBBLE_WIDTH - 8)
  const top = beside
    ? hit.y - hit.r * 0.35 - BUBBLE_HEIGHT / 2 // 머리 높이 옆
    : hit.y - hit.r * 1.3 - BUBBLE_HEIGHT - 14 // 머리 꼭대기 위
  // 꼬리: 옆에 있을 땐 왼쪽(하치와레 쪽), 위에 있을 땐 아래쪽을 향한다 — 테두리는 바깥 두 변에만
  const tail: React.CSSProperties = beside
    ? { left: -6, top: BUBBLE_HEIGHT / 2 - 6, borderLeftWidth: 2, borderBottomWidth: 2 }
    : { bottom: -6, left: Math.min(Math.max(hit.x - left - 6, 12), BUBBLE_WIDTH - 24), borderRightWidth: 2, borderBottomWidth: 2 }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-30 select-none transition-opacity duration-500"
      style={{ left, top, width: BUBBLE_WIDTH, opacity: hidden ? 0 : 1 }}
    >
      {/* 손으로 그린 듯 살짝 울퉁불퉁한 테두리 (글자는 왜곡하지 않도록 따로 그림) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="hint-wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
        </filter>
      </svg>
      <div className="absolute inset-0" style={{ filter: 'url(#hint-wobble)', opacity: 0.85 }}>
        <div className="absolute inset-0 rounded-2xl border-2 bg-white" style={{ borderColor: BUBBLE_BORDER }} />
        {/* 말풍선 꼬리 */}
        <span
          className="absolute h-3 w-3 rotate-45 border-0 border-solid bg-white"
          style={{ ...tail, borderColor: BUBBLE_BORDER }}
        />
      </div>
      <div
        className="relative px-3 py-1.5 text-center text-xs font-medium"
        style={{ color: BUBBLE_BORDER }}
      >
        나를<br />눌러 봐!
      </div>
    </div>
  )
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 스크롤이 맨 아래에 닿으면 하치와레 옆에 말풍선만 나오고(눌러서 사라지면 그 스크롤 동안은 안 나옴, 위로 올렸다 다시 내리면 다시 나옴),
// 치이카와나 하치와레를 누르고 있는 동안 그 캐릭터가 하트를 내보낸다.
export default function CharacterHearts({ enabled }: { enabled: boolean }) {
  const [atBottom, setAtBottom] = useState(false)
  const [hits, setHits] = useState<HitArea[]>([])
  const [pressing, setPressing] = useState<number | null>(null) // 누르고 있는 캐릭터 번호
  // 눌러서 사라진 말풍선은 맨 아래에 머무는 동안 다시 나오지 않고, 맨 아래를 벗어나면 초기화된다
  const [hintDismissed, setHintDismissed] = useState(false)
  const [hearts, setHearts] = useState<Heart[]>([])
  const nextKey = useRef(0)
  const active = enabled && atBottom

  useEffect(() => {
    const check = () => {
      const el = document.documentElement
      const bottom = el.scrollHeight > window.innerHeight + 40 && window.scrollY + window.innerHeight >= el.scrollHeight - 8
      setAtBottom(bottom)
      if (!bottom) setHintDismissed(false) // 맨 아래를 벗어나면 다음에 내려올 때 말풍선이 다시 나온다
      setHits(BODIES.map(b => {
        const c = toScreen(b.x, b.y, window.innerWidth, window.innerHeight)
        return { x: c.x, y: c.y, r: b.r * c.scale }
      }))
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

  // 캐릭터를 누르고 있는 동안 그 캐릭터의 하트만 빠르게
  useEffect(() => {
    if (pressing === null || !active) return
    if (prefersReducedMotion()) return
    const spawn = () => setHearts(prev => [...prev, makeHeart(nextKey.current++, pressing, 0)].slice(-MAX_HEARTS))
    const first = setTimeout(spawn, 0)
    const id = setInterval(spawn, HOLD_SPAWN_MS)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [pressing, active])

  return (
    <>
      {/* 하치와레 옆 말풍선: 맨 아래에서만, 눌러서 사라지면 위로 올렸다 내려올 때까지 숨김 */}
      {active && hits[1] && <Hint hit={hits[1]} hidden={hintDismissed} />}
      {/* 두 캐릭터 위의 보이지 않는 터치 영역 (맨 아래에서만 활성 — 목록 조작을 막지 않도록) */}
      {active && hits.map((hit, i) => (
        <div
          key={i}
          aria-hidden
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setPressing(i); setHintDismissed(true) }}
          onPointerUp={() => setPressing(null)}
          onPointerCancel={() => setPressing(null)}
          onContextMenu={e => e.preventDefault()}
          className="fixed z-30 touch-none select-none rounded-full"
          style={{ left: hit.x - hit.r, top: hit.y - hit.r, width: hit.r * 2, height: hit.r * 2, WebkitTouchCallout: 'none' }}
        />
      ))}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
        {hearts.map(h => (
          <span
            key={h.key}
            onAnimationEnd={e => {
              if (e.target === e.currentTarget) setHearts(prev => prev.filter(x => x.key !== h.key))
            }}
            className="absolute select-none"
            style={{
              left: h.x,
              top: h.y,
              fontSize: h.size,
              ['--dx' as string]: `${h.dx}px`,
              ['--dy' as string]: `${h.dy}px`,
              animation: `heart-pop ${h.duration}s ease-out ${h.delay}s both`,
            }}
          >
            {/* 바깥: 튀어나와 떠오르며 커지고 사라짐 / 안쪽: 좌우로 살랑살랑 흔들리며 기울어짐 */}
            <span
              className="inline-block"
              style={{
                ['--sway' as string]: `${h.sway}px`,
                ['--tilt' as string]: `${h.tilt}deg`,
                animation: `heart-sway ${h.swayDuration}s ease-in-out infinite alternate`,
              }}
            >
              {h.emoji}
            </span>
          </span>
        ))}
      </div>
    </>
  )
}
