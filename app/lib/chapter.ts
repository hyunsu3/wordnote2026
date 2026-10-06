// 평가원 필수 어휘 1200: 챕터 21~30 = 601~1200번 (챕터당 60개)
const RANGE_FIRST_CHAPTER = 21
const RANGE_LAST_CHAPTER = 30
const RANGE_FIRST_NUMBER = 601
const CHAPTER_SIZE = 60

// 구동사189: 챕터 101~119 = 전치사 그룹 1~19
const PHRASAL_OFFSET = 100
const PHRASAL_PARTICLES = [
  'on', 'off', 'away', 'over', 'in', 'out', 'at', 'from', 'after', 'for',
  'up', 'down', 'along', 'with', 'about', 'around', 'by', 'across', 'through',
]

export function chapterName(ch: number): string {
  const p = PHRASAL_PARTICLES[ch - PHRASAL_OFFSET - 1]
  if (p) return `${ch - PHRASAL_OFFSET}챕터(${p})`
  if (ch < RANGE_FIRST_CHAPTER || ch > RANGE_LAST_CHAPTER) return `${ch}챕터`
  const start = RANGE_FIRST_NUMBER + (ch - RANGE_FIRST_CHAPTER) * CHAPTER_SIZE
  return `${ch}챕터(${start}~${start + CHAPTER_SIZE - 1})`
}
