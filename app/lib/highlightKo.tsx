import type { ReactNode } from 'react'

// 한글 해석 속 {{...}} 로 감싼 부분을 보라색으로 강조한다. (마커가 없으면 그대로 출력)
export function renderExampleKo(text: string, className: string): ReactNode {
  return text.split(/\{\{(.+?)\}\}/g).map((part, i) =>
    i % 2 === 1 ? <span key={i} className={className}>{part}</span> : part
  )
}

// 기출이 아닌 직접 작성한 예문인지 (카드의 '예문' 버튼을 주황색으로 표시)
export const isOwnExample = (source?: string) => !!source?.startsWith('직접 작성')
