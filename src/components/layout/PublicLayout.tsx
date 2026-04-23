import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { PublicNav } from './PublicNav'

function HillsBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #fbf8f1 0%, #fbf8f1 35%, #f3ecd9 60%, #e6ebc9 90%)',
        }}
      />
      {/* Sun */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '80px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,217,112,0.45), rgba(245,217,112,0) 60%)',
        }}
      />

      {/* Rolling hills — back layer */}
      <svg
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-[360px] opacity-80"
      >
        <path
          d="M0,260 C180,180 360,300 540,260 C720,220 900,320 1080,280 C1260,240 1380,260 1440,240 L1440,500 L0,500 Z"
          fill="#cfe2bc"
        />
      </svg>
      {/* Rolling hills — middle layer */}
      <svg
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-[280px] opacity-90"
      >
        <path
          d="M0,300 C160,240 320,360 500,320 C680,280 860,380 1040,340 C1220,300 1360,340 1440,320 L1440,500 L0,500 Z"
          fill="#b4d49b"
        />
      </svg>
      {/* Rolling hills — front layer */}
      <svg
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-[180px]"
      >
        <path
          d="M0,380 C200,340 380,420 600,390 C820,360 1000,430 1220,400 C1340,385 1400,395 1440,390 L1440,500 L0,500 Z"
          fill="#8bbf72"
        />
      </svg>

      {/* Pin flags on hills */}
      <svg
        viewBox="0 0 40 60"
        className="absolute bottom-[155px] right-[18%] w-6 h-10 opacity-80 hidden sm:block"
      >
        <line x1="10" y1="5" x2="10" y2="58" stroke="#0f2b14" strokeWidth="2" strokeLinecap="round" />
        <polygon points="10,5 34,14 10,23" fill="#ff6b5b" />
      </svg>
      <svg
        viewBox="0 0 40 60"
        className="absolute bottom-[175px] left-[22%] w-5 h-8 opacity-60 hidden sm:block"
      >
        <line x1="10" y1="5" x2="10" y2="58" stroke="#0f2b14" strokeWidth="2" strokeLinecap="round" />
        <polygon points="10,5 34,14 10,23" fill="#d4a520" />
      </svg>
    </div>
  )
}

export function PublicLayout() {
  return (
    <div className="relative min-h-screen">
      <HillsBackdrop />
      <div className="max-w-[720px] mx-auto pb-24">
        <SiteHeader />
        <PublicNav />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
