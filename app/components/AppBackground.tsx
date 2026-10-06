// 배경: 넓은 화면은 꽉 채우고, 모바일은 캐릭터가 보이도록 왼쪽 아래에 배치
export default function AppBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-[#c1dd69]">
      <div
        className="absolute inset-0 hidden sm:block bg-cover bg-left-bottom"
        style={{ backgroundImage: 'url(/bg.webp)' }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[90%] sm:hidden bg-no-repeat bg-left-bottom"
        style={{
          backgroundImage: 'url(/bg.webp)',
          backgroundSize: 'auto 100%',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%)',
        }}
      />
    </div>
  )
}
