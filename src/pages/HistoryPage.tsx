import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { StarRating } from '@/components/ui/StarRating'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
import { useSeasons } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'
import { useScoresBySeason } from '@/hooks/useScores'
import { usePlayers } from '@/hooks/usePlayers'
import type { Season, Tournament, Score, Player } from '@/types/db'

const POS_LABEL = ['1st', '2nd', '3rd']

function TournamentHistoryCard({
  tournament,
  scores,
  players,
}: {
  tournament: Tournament
  scores: Score[]
  players: Player[]
}) {
  const byPlayer = new Map<string, { gross: number; position: number; points: number }>()
  for (const s of scores) {
    if (s.tournament_id !== tournament.id) continue
    const existing = byPlayer.get(s.player_id)
    if (existing) {
      existing.gross += s.gross_score
      existing.points += s.points_awarded
    } else {
      byPlayer.set(s.player_id, {
        gross: s.gross_score,
        position: s.position ?? 99,
        points: s.points_awarded,
      })
    }
  }

  const sorted = [...byPlayer.entries()]
    .map(([playerId, d]) => ({ playerId, ...d }))
    .sort((a, b) => a.position - b.position)

  return (
    <div className="py-3 border-b border-green-pale last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-serif text-sm text-green-dark">{tournament.name}</p>
          {tournament.course && (
            <p className="font-sans text-xs text-green-mid">
              {tournament.course}{tournament.date ? ` · ${tournament.date}` : ''}
            </p>
          )}
        </div>
        {tournament.course_rating != null && tournament.course_rating > 0 && (
          <StarRating value={tournament.course_rating} symbol="⛳" />
        )}
      </div>

      <div className="space-y-1.5">
        {sorted.map(({ playerId, gross, position, points }, i) => {
          const player = players.find((p) => p.id === playerId)
          if (!player) return null
          const isWinner = i === 0
          return (
            <div key={playerId} className="flex items-center gap-2">
              <span className={`font-sans text-[10px] w-5 text-right ${isWinner ? 'text-gold font-bold' : 'text-green-mid'}`}>
                {POS_LABEL[i] ?? `${position}th`}
              </span>
              <PlayerAvatar
                name={player.name}
                initials={player.initials}
                color={player.color}
                avatarUrl={player.avatar_url}
                size="sm"
              />
              <span className={`font-serif text-sm flex-1 ${isWinner ? 'text-green-dark' : 'text-green-mid'}`}>
                {player.name}
              </span>
              <span className="font-sans text-xs text-green-mid">
                {tournament.rounds > 1 ? `${gross} total` : `${gross} strokes`}
              </span>
              <span className="font-sans text-xs font-medium text-green-mid w-14 text-right">
                {points > 0 ? `+${points} pts` : '0 pts'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SeasonBlock({ season, players }: { season: Season; players: Player[] }) {
  const { data: tournaments } = useTournaments(season.id)
  const { data: scores } = useScoresBySeason(season.id)

  const completed = tournaments?.filter((t) => t.status === 'completed') ?? []
  if (!completed.length) return null

  return (
    <div className="mb-6">
      <SectionLabel>{season.name}</SectionLabel>
      <Card className="px-4 py-0">
        {completed.map((t) => (
          <TournamentHistoryCard
            key={t.id}
            tournament={t}
            scores={scores ?? []}
            players={players}
          />
        ))}
      </Card>
    </div>
  )
}

export function HistoryPage() {
  const { data: seasons, isLoading } = useSeasons()
  const { data: players } = usePlayers()

  const withResults = seasons
    ?.slice()
    .sort((a, b) => b.year - a.year) ?? []

  const hasAny = withResults.length > 0

  return (
    <div className="p-4 pt-2">
      {isLoading ? (
        <>
          <SectionLabel>Results log</SectionLabel>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-green-pale/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </>
      ) : !hasAny ? (
        <>
          <SectionLabel>Results log</SectionLabel>
          <EmptyState
            message="No results yet"
            hint="History will appear here once tournament scores are entered."
          />
        </>
      ) : (
        <>
          {withResults.map((s) => (
            <SeasonBlock key={s.id} season={s} players={players ?? []} />
          ))}
        </>
      )}
    </div>
  )
}
