import { useActiveSeason } from '@/hooks/useSeasons'

function FlagIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="w-5 h-5 flex-shrink-0"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <line x1="5" y1="2" x2="5" y2="18" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="5,2 15,6 5,10" fill="#c9a84c" />
    </svg>
  )
}

export function SiteHeader() {
  const { data: season } = useActiveSeason()
  const seasonLabel = season ? season.name : 'BAGAL'

  return (
    <div className="bg-green-dark text-cream text-center pt-4 px-4 pb-0">
      <div className="flex items-center justify-center gap-2 mb-0.5">
        <FlagIcon />
        <span className="font-sans text-[10px] tracking-[0.16em] uppercase text-cream/50">
          Below Average Golfers Association League
        </span>
        <FlagIcon flip />
      </div>

      <h1 className="font-serif text-[26px] font-normal leading-tight tracking-[0.02em]">
        BAGAL{' '}
        <em className="not-italic text-gold-light">{seasonLabel}</em>
      </h1>

      <p className="font-sans text-[10px] tracking-[0.08em] uppercase text-cream/40 mt-0.5 mb-3">
        Luke &bull; Alex &bull; Peter &bull; Est.&nbsp;Year&nbsp;1
      </p>

      <div className="h-px bg-white/10 -mx-4" />
    </div>
  )
}
