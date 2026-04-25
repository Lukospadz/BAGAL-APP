import { useEffect } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { StatusPill } from '@/components/ui/StatusPill'
import { usePropBets } from '@/hooks/useProps'
import type { Tournament, Score, Player } from '@/types/db'

const FORMAT_LABEL: Record<string, string> = {
  stroke: 'Stroke play',
  match: 'Match play',
  scramble: 'Scramble',
}

const POS_LABEL = ['1st', '2nd', '3rd']

interface Props {
  tournament: Tournament
  scores: Score[]
  players: Player[]
  onClose: () => void
}

export function TournamentSheet({ tournament, scores, players, onClose }: Props) {
  const { data: propBets } = usePropBets(tournament.id)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Build results
  const byPlayer = new Map<string, { gross: number; position: number; points: number }>()
  for (const s of scores) {
    if (s.tournament_id !== tournament.id) continue
    const e = byPlayer.get(s.player_id)
    if (e) { e.gross += s.gross_score; e.points += s.points_awarded }
    else byPlayer.set(s.player_id, { gross: s.gross_score, position: s.position ?? 99, points: s.points_awarded })
  }
  const sorted = [...byPlayer.entries()]
    .map(([playerId, d]) => ({ playerId, ...d }))
    .sort((a, b) => a.position - b.position)

  const settledProps = propBets?.filter((b) => b.status === 'settled') ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-3xl sm:rounded-3xl max-h-[88vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-green-pale" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-green-pale flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill status={tournament.status} />
              {tournament.course_rating != null && tournament.course_rating > 0 && (
                <StarRating value={tournament.course_rating} />
              )}
            </div>
            <h2 className="font-serif text-xl text-green-dark leading-tight">{tournament.name}</h2>
            {tournament.course && (
              <p className="font-sans text-sm text-green-mid mt-0.5">
                {tournament.course}
                {tournament.date ? ` · ${tournament.date}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-green-pale flex items-center justify-center text-green-mid hover:text-green-dark transition-colors mt-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Tournament meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetaItem label="Format" value={FORMAT_LABEL[tournament.format] ?? tournament.format} />
            <MetaItem label="Holes" value={`${tournament.holes} holes`} />
            {tournament.par && <MetaItem label="Par" value={String(tournament.par)} />}
            {tournament.rounds > 1 && <MetaItem label="Rounds" value={String(tournament.rounds)} />}
            <MetaItem label="Points" value={`${tournament.points_1st} / ${tournament.points_2nd} / ${tournament.points_3rd}`} />
          </div>

          {tournament.notes && (
            <p className="font-serif text-sm italic text-green-mid">{tournament.notes}</p>
          )}

          {/* Results */}
          {tournament.status === 'completed' && sorted.length > 0 && (
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-green-mid mb-2">Results</p>
              <div className="space-y-2">
                {sorted.map(({ playerId, gross, position, points }, i) => {
                  const player = players.find((p) => p.id === playerId)
                  if (!player) return null
                  const isWinner = i === 0
                  return (
                    <div
                      key={playerId}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${isWinner ? 'bg-gold/10 border border-gold/30' : 'bg-green-pale/40'}`}
                    >
                      <span className={`font-sans text-xs font-bold w-6 text-center ${isWinner ? 'text-gold' : 'text-green-mid'}`}>
                        {POS_LABEL[i] ?? `${position}`}
                      </span>
                      <PlayerAvatar
                        name={player.name}
                        initials={player.initials}
                        color={player.color}
                        avatarUrl={player.avatar_url}
                        frame={player.active_frame}
                        size="sm"
                      />
                      <span className={`font-serif text-sm flex-1 ${isWinner ? 'text-green-dark font-semibold' : 'text-green-mid'}`}>
                        {player.name}
                      </span>
                      <span className="font-sans text-xs text-green-mid">
                        {tournament.rounds > 1 ? `${gross} total` : `${gross}`}
                      </span>
                      <span className="font-sans text-xs font-semibold text-green-mid w-12 text-right">
                        {points > 0 ? `+${points} pts` : '0 pts'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming — no results yet */}
          {tournament.status === 'upcoming' && (
            <p className="font-serif italic text-green-mid text-sm text-center py-2">
              Results will appear here after the tournament.
            </p>
          )}

          {/* Settled props */}
          {settledProps.length > 0 && (
            <div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-green-mid mb-2">Prop results</p>
              <div className="space-y-1.5">
                {settledProps.map((bet) => (
                  <div key={bet.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-sans text-sm text-green-dark flex-1">{bet.description}</span>
                    <span className={`font-sans text-xs font-semibold flex-shrink-0 ${bet.result ? 'text-emerald-600' : 'text-red-500'}`}>
                      {bet.result ? 'Yes' : 'No'} · {bet.odds}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-sans text-[10px] uppercase tracking-wide text-green-mid/60">{label} </span>
      <span className="font-sans text-xs text-green-dark font-medium">{value}</span>
    </div>
  )
}
