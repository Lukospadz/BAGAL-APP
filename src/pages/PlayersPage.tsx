import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { usePlayers } from '@/hooks/usePlayers'
import type { Player } from '@/types/db'

type SortKey = 'name' | 'bucks'
type ViewMode = 'card' | 'list'

function sortPlayers(players: Player[], key: SortKey): Player[] {
  return [...players].sort((a, b) =>
    key === 'bucks' ? b.bagal_bucks - a.bagal_bucks : a.name.localeCompare(b.name)
  )
}

function PlayerCard({ p }: { p: Player }) {
  return (
    <Link
      to={`/players/${p.id}`}
      className="rounded-xl border border-green-pale shadow-card bg-white overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="h-14 relative" style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-8">
          <div className="rounded-full bg-white p-1 shadow-card">
            <PlayerAvatar name={p.name} initials={p.initials} color={p.color}
              avatarUrl={p.avatar_url} frame={p.active_frame} size="lg" />
          </div>
        </div>
      </div>
      <div className="pt-10 pb-4 px-4 text-center flex-1 flex flex-col">
        <p className="font-serif text-base text-green-dark leading-tight">{p.name}</p>
        {p.active_title ? (
          <p className="font-sans text-[11px] text-gold font-medium mt-1 italic">&ldquo;{p.active_title}&rdquo;</p>
        ) : (
          <p className="font-sans text-[11px] text-green-mid/50 mt-1 italic">No title equipped</p>
        )}
        {p.home_course && (
          <p className="font-sans text-xs text-green-mid mt-2">
            <span className="tracking-widest uppercase text-[9px] text-green-mid/60">Home </span>
            {p.home_course}
          </p>
        )}
        {p.bio && (
          <p className="font-serif text-xs italic text-green-mid/70 mt-2 line-clamp-2">{p.bio}</p>
        )}
        <div className="mt-auto pt-3">
          <div className="bg-green-faint rounded-lg px-3 py-2 flex items-center justify-center gap-1.5">
            <span className="font-serif text-lg text-gold font-bold leading-none">{p.bagal_bucks.toLocaleString()}</span>
            <span className="font-sans text-[10px] tracking-widest uppercase text-green-mid">BB</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PlayerListItem({ p }: { p: Player }) {
  return (
    <Link
      to={`/players/${p.id}`}
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-green-pale shadow-card hover:shadow-md active:scale-[0.99] transition-all"
    >
      <PlayerAvatar name={p.name} initials={p.initials} color={p.color}
        avatarUrl={p.avatar_url} frame={p.active_frame} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-serif text-base text-green-dark leading-tight">{p.name}</p>
        {p.active_title ? (
          <p className="font-sans text-xs text-gold italic truncate">&ldquo;{p.active_title}&rdquo;</p>
        ) : p.home_course ? (
          <p className="font-sans text-xs text-green-mid truncate">{p.home_course}</p>
        ) : (
          <p className="font-sans text-xs text-green-mid/50 italic">No title</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-serif text-base text-gold font-bold leading-none">{p.bagal_bucks.toLocaleString()}</p>
        <p className="font-sans text-[10px] uppercase tracking-wide text-green-mid/60">BB</p>
      </div>
    </Link>
  )
}

export function PlayersPage() {
  const { data: players, isLoading } = usePlayers()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const sorted = useMemo(() => sortPlayers(players ?? [], sortKey), [players, sortKey])

  return (
    <div className="p-4 pt-2">
      {!isLoading && !!players?.length && (
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex gap-1.5">
            {(['name', 'bucks'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => setSortKey(k)}
                className={[
                  'font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                  sortKey === k
                    ? 'bg-green-dark text-cream border-green-dark'
                    : 'bg-white text-green-mid border-green-pale hover:border-green-mid',
                ].join(' ')}
              >
                {k === 'name' ? 'A–Z' : 'Most BB'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-green-pale/50 rounded-full p-0.5">
            <button onClick={() => setViewMode('list')} aria-label="List view"
              className={['font-sans text-xs px-2.5 py-1 rounded-full transition-all',
                viewMode === 'list' ? 'bg-white text-green-dark shadow-sm' : 'text-green-mid'].join(' ')}>
              ☰
            </button>
            <button onClick={() => setViewMode('card')} aria-label="Card view"
              className={['font-sans text-xs px-2.5 py-1 rounded-full transition-all',
                viewMode === 'card' ? 'bg-white text-green-dark shadow-sm' : 'text-green-mid'].join(' ')}>
              ⊞
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-green-pale/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : !sorted.length ? (
        <EmptyState message="No players yet" hint="An admin will set up the player profiles." />
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {sorted.map((p) => <PlayerListItem key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sorted.map((p) => <PlayerCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}
