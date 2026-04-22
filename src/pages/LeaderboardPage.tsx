import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
import { useActiveSeason } from '@/hooks/useSeasons'
import { useStandings } from '@/hooks/useStandings'
import { useCasualRounds } from '@/hooks/useCasualRounds'
import { usePlayers } from '@/hooks/usePlayers'
import { useSeasons } from '@/hooks/useSeasons'
import type { PlayerStanding } from '@/lib/scoring'

const MEDALS = ['1st', '2nd', '3rd']

function PodiumCard({ standing, position }: { standing: PlayerStanding; position: number }) {
  const isFirst = position === 0
  return (
    <div
      className={[
        'rounded-xl p-4 text-center text-cream relative overflow-hidden',
        isFirst
          ? 'bg-gradient-to-b from-green-dark to-green-mid'
          : 'bg-green-dark',
      ].join(' ')}
    >
      {isFirst && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold" />
      )}
      <p className="font-sans text-[11px] tracking-widest uppercase text-cream/50 mb-2">
        {MEDALS[position]}
      </p>
      <div className="flex justify-center mb-2">
        <PlayerAvatar
          name={standing.player.name}
          initials={standing.player.initials}
          color={standing.player.color}
          avatarUrl={standing.player.avatar_url}
          size={isFirst ? 'lg' : 'md'}
        />
      </div>
      <p className="font-serif text-sm text-cream mb-1">{standing.player.name}</p>
      <p className={`font-serif text-gold-light ${isFirst ? 'text-3xl' : 'text-2xl'}`}>
        {standing.totalPoints}
      </p>
      <p className="font-sans text-[10px] tracking-widest uppercase text-cream/40 mt-0.5">
        points
      </p>
      {standing.tournamentsPlayed > 0 && (
        <p className="font-sans text-[10px] text-cream/40 mt-1">
          {standing.tournamentsPlayed} played · {standing.wins} {standing.wins === 1 ? 'win' : 'wins'}
        </p>
      )}
    </div>
  )
}

function HallOfFame() {
  const { data: seasons } = useSeasons()
  const { data: players } = usePlayers()

  const completed = seasons?.filter((s) => s.status === 'completed' && s.champion_player_id)
    .sort((a, b) => a.year - b.year)

  if (!completed?.length) return null

  return (
    <>
      <SectionLabel>Green jacket hall of fame</SectionLabel>
      <Card variant="tinted" className="p-4">
        {completed.map((s) => {
          const champion = players?.find((p) => p.id === s.champion_player_id)
          return (
            <div
              key={s.id}
              className="flex items-center gap-3 py-2 border-b border-green-pale last:border-0"
            >
              <span className="font-sans text-xs font-medium text-green-mid w-16">{s.name}</span>
              {champion && (
                <PlayerAvatar
                  name={champion.name}
                  initials={champion.initials}
                  color={champion.color}
                  avatarUrl={champion.avatar_url}
                  size="sm"
                />
              )}
              <span className="font-serif text-sm text-green-dark flex-1">
                {champion?.name ?? '—'}
              </span>
              <span className="font-sans text-[10px] px-2 py-0.5 rounded-full bg-gold-faint text-yellow-800 border border-gold/30">
                Champion
              </span>
            </div>
          )
        })}
      </Card>
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
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 bg-green-dark/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !season ? (
        <EmptyState message="No active season" hint="An admin will set up the current season." />
      ) : standings.length === 0 ? (
        <EmptyState message="No scores yet this season" hint="Check back after the first tournament." />
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {standings.map((s, i) => (
            <PodiumCard key={s.player.id} standing={s} position={i} />
          ))}
        </div>
      )}

      <HallOfFame />

      <SectionLabel>Casual round bonuses</SectionLabel>
      {!casualRounds?.length ? (
        <EmptyState message="No casual round bonuses yet this season" />
      ) : (
        <Card className="divide-y divide-green-pale">
          {casualRounds.map((r) => {
            const player = players?.find((p) => p.id === r.winner_player_id)
            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-sans text-sm text-green-dark">
                  {r.date}{r.course ? ` — ${r.course}` : ''}
                </span>
                <span className="font-sans text-sm font-medium text-green-mid">
                  +{r.points_awarded} → {player?.name ?? '—'}
                </span>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
