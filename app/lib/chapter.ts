// 평가원 필수 어휘 1200: 챕터 21~30 = 601~1200번 (챕터당 60개)
const RANGE_FIRST_CHAPTER = 21
const RANGE_LAST_CHAPTER = 30
const RANGE_FIRST_NUMBER = 601
const CHAPTER_SIZE = 60

export function chapterName(ch: number): string {
  if (ch < RANGE_FIRST_CHAPTER || ch > RANGE_LAST_CHAPTER) return `${ch}챕터`
  const start = RANGE_FIRST_NUMBER + (ch - RANGE_FIRST_CHAPTER) * CHAPTER_SIZE
  return `${ch}챕터(${start}~${start + CHAPTER_SIZE - 1})`
}
