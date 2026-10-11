import type { ReactNode } from 'react'

// 한글 해석 속 {{...}} 로 감싼 부분을 보라색으로 강조한다. (마커가 없으면 그대로 출력)
export function renderExampleKo(text: string, className: string): ReactNode {
  return text.split(/\{\{(.+?)\}\}/g).map((part, i) =>
    i % 2 === 1 ? <span key={i} className={className}>{part}</span> : part
  )
}
