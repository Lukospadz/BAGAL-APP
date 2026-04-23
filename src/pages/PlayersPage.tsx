import { Link } from 'react-router-dom'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { usePlayers } from '@/hooks/usePlayers'

export function PlayersPage() {
  const { data: players, isLoading } = usePlayers()

  return (
    <div className="p-4 pt-2">
      <SectionLabel>The field</SectionLabel>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-green-pale/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !players?.length ? (
        <EmptyState
          message="No players yet"
          hint="An admin will set up the player profiles."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {players.map((p) => (
            <Link
              key={p.id}
              to={`/players/${p.id}`}
              className="rounded-xl border border-green-pale shadow-card bg-white overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Colored top banner with player color */}
              <div
                className="h-14 relative"
                style={{
                  background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                }}
              >
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-8">
                  <div className="rounded-full bg-white p-1 shadow-card">
                    <PlayerAvatar
                      name={p.name}
                      initials={p.initials}
                      color={p.color}
                      avatarUrl={p.avatar_url}
                      frame={p.active_frame}
                      size="lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-10 pb-4 px-4 text-center flex-1 flex flex-col">
                <p className="font-serif text-base text-green-dark leading-tight">
                  {p.name}
                </p>
                {p.active_title ? (
                  <p className="font-sans text-[11px] text-gold font-medium mt-1 italic">
                    &ldquo;{p.active_title}&rdquo;
                  </p>
                ) : (
                  <p className="font-sans text-[11px] text-green-mid/50 mt-1 italic">
                    No title equipped
                  </p>
                )}

                {p.home_course && (
                  <p className="font-sans text-xs text-green-mid mt-2">
                    <span className="tracking-widest uppercase text-[9px] text-green-mid/60">Home </span>
                    {p.home_course}
                  </p>
                )}
                {p.bio && (
                  <p className="font-serif text-xs italic text-green-mid/70 mt-2 line-clamp-2">
                    {p.bio}
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <div className="bg-green-faint rounded-lg px-3 py-2 flex items-center justify-center gap-1.5">
                    <span className="font-serif text-lg text-gold font-bold leading-none">
                      {p.bagal_bucks.toLocaleString()}
                    </span>
                    <span className="font-sans text-[10px] tracking-widest uppercase text-green-mid">
                      BB
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
