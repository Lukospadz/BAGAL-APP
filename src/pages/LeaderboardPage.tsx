import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { useActiveSeason } from '@/hooks/useSeasons'
import { useStandings } from '@/hooks/useStandings'
import { useCasualRounds } from '@/hooks/useCasualRounds'
import { usePlayers } from '@/hooks/usePlayers'
import { useSeasons } from '@/hooks/useSeasons'
import type { PlayerStanding } from '@/lib/scoring'

const POSITION_STYLE = [
  { bg: '#A8822A', label: '1st' },   // brass gold
  { bg: '#8E9BAD', label: '2nd' },   // pewter silver
  { bg: '#B07D50', label: '3rd' },   // bronze
]

function PositionBadge({ position }: { position: number }) {
  const meta = POSITION_STYLE[position - 1]
  if (meta) {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center font-sans text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
        style={{ backgroundColor: meta.bg }}
      >
        {position}
      </div>
    )
  }
  return (
    <span className="w-7 text-center font-sans text-sm text-green-mid/50 flex-shrink-0">{position}</span>
  )
}

function StandingRow({ standing, index }: { standing: PlayerStanding; index: number }) {
  const position = index + 1
  const isEven = index % 2 === 1

  return (
    <Link
      to={`/players/${standing.player.id}`}
      className={`grid grid-cols-[44px_1fr_56px_48px] items-center px-4 py-3 border-b border-bone/60 last:border-0 hover:bg-gold-faint/50 transition-colors ${isEven ? 'bg-bone/25' : 'bg-white'}`}
    >
      <div className="flex items-center">
        <PositionBadge position={position} />
      </div>

      <div className="flex items-center gap-2.5 min-w-0">
        <PlayerAvatar
          name={standing.player.name}
          initials={standing.player.initials}
          color={standing.player.color}
          avatarUrl={standing.player.avatar_url}
          frame={standing.player.active_frame}
          size="sm"
        />
        <div className="min-w-0">
          <p className="font-serif text-sm text-green-dark font-semibold leading-tight truncate">
            {standing.player.name}
          </p>
          {standing.player.active_title ? (
            <p className="font-sans text-[10px] text-gold italic truncate">
              &ldquo;{standing.player.active_title}&rdquo;
            </p>
          ) : (
            standing.tournamentsPlayed > 0 && (
              <p className="font-sans text-[10px] text-green-mid/60">
                {standing.tournamentsPlayed} played
              </p>
            )
          )}
        </div>
      </div>

      <p className="font-display text-2xl text-green-dark font-bold text-right leading-none">
        {standing.totalPoints}
      </p>

      <p className="font-sans text-xs text-green-mid/70 text-right">
        {standing.wins}W
      </p>
    </Link>
  )
}

function StandingsTable({ standings, seasonName }: { standings: PlayerStanding[]; seasonName?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-bone shadow-card mb-2">
      {/* Scorecard header */}
      <div className="grid grid-cols-[44px_1fr_56px_48px] bg-green-dark px-4 py-2.5">
        <span />
        <span className="font-sans text-[9px] font-bold tracking-[0.2em] uppercase text-cream/50">
          {seasonName ?? 'Player'}
        </span>
        <span className="font-sans text-[9px] font-bold tracking-[0.2em] uppercase text-cream/50 text-right">
          Pts
        </span>
        <span className="font-sans text-[9px] font-bold tracking-[0.2em] uppercase text-cream/50 text-right">
          Wins
        </span>
      </div>

      {standings.map((s, i) => (
        <StandingRow key={s.player.id} standing={s} index={i} />
      ))}
    </div>
  )
}

function HallOfFame() {
  const { data: seasons } = useSeasons()
  const { data: players } = usePlayers()

  const completed = seasons
    ?.filter((s) => s.status === 'completed' && s.champion_player_id)
    .sort((a, b) => a.year - b.year)

  if (!completed?.length) return null

  return (
    <>
      <SectionLabel>Green jacket hall of fame</SectionLabel>
      <div className="overflow-hidden rounded-xl border border-bone shadow-card mb-2">
        <div className="bg-green-dark px-4 py-2.5">
          <span className="font-sans text-[9px] font-bold tracking-[0.2em] uppercase text-gold/70">
            Champions
          </span>
        </div>
        {completed.map((s) => {
          const champion = players?.find((p) => p.id === s.champion_player_id)
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-bone/60 last:border-0 bg-white odd:bg-bone/20"
            >
              <span className="font-sans text-xs font-semibold text-green-mid w-20 flex-shrink-0 tracking-wide">
                {s.name}
              </span>
              {champion && (
                <PlayerAvatar
                  name={champion.name}
                  initials={champion.initials}
                  color={champion.color}
                  avatarUrl={champion.avatar_url}
                  frame={champion.active_frame}
                  size="sm"
                />
              )}
              <span className="font-serif text-sm text-green-dark flex-1">
                {champion?.name ?? '—'}
              </span>
              <span className="font-sans text-[10px] text-gold border border-gold/30 bg-gold-faint px-2 py-0.5 rounded-full">
                Champion
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function LeaderboardPage() {
  const { data: season, isLoading: seasonLoading } = useActiveSeason()
  const { standings, isLoading: standingsLoading } = useStandings(season?.id)
  const { data: casualRounds } = useCasualRounds(season?.id)
  const { data: players } = usePlayers()

  const isLoading = seasonLoading || standingsLoading

  return (
    <div className="p-4 pt-2">
      <SectionLabel>
        {season ? `${season.name} standings` : 'Season standings'}
      </SectionLabel>

      {isLoading ? (
        <div className="space-y-1 rounded-xl border border-bone overflow-hidden shadow-card mb-2">
          <div className="h-10 bg-green-dark" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-bone/30 animate-pulse border-b border-bone/60 last:border-0" />
          ))}
        </div>
      ) : !season ? (
        <EmptyState message="No active season" hint="An admin will set up the current season." />
      ) : standings.length === 0 ? (
        <EmptyState message="No scores yet this season" hint="Check back after the first tournament." />
      ) : (
        <StandingsTable standings={standings} seasonName={season.name} />
      )}

      <HallOfFame />

      <SectionLabel>Casual round bonuses</SectionLabel>
      {!casualRounds?.length ? (
        <EmptyState message="No casual round bonuses yet this season" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-bone shadow-card">
          {casualRounds.map((r, i) => {
            const player = players?.find((p) => p.id === r.winner_player_id)
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 border-b border-bone/60 last:border-0 ${i % 2 === 1 ? 'bg-bone/20' : 'bg-white'}`}
              >
                <span className="font-sans text-sm text-green-dark">
                  {r.date}{r.course ? ` — ${r.course}` : ''}
                </span>
                <span className="font-sans text-sm font-semibold text-green-mid">
                  +{r.points_awarded} → {player?.name ?? '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
