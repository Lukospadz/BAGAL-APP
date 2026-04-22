import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPill } from '@/components/ui/StatusPill'
import { StarRating } from '@/components/ui/StarRating'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
import { useActiveSeason } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'
import { useScoresBySeason } from '@/hooks/useScores'
import { usePlayers } from '@/hooks/usePlayers'
import type { Tournament, Score, Player } from '@/types/db'

const POS_LABEL = ['1st', '2nd', '3rd']

function ResultRows({
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

  if (!sorted.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-green-pale space-y-2">
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
  )
}

export function TournamentsPage() {
  const { data: season } = useActiveSeason()
  const { data: tournaments, isLoading } = useTournaments(season?.id)
  const { data: scores } = useScoresBySeason(season?.id)
  const { data: players } = usePlayers()

  return (
    <div className="p-4 pt-2">
      <SectionLabel>
        {season ? `${season.name} events` : 'Season events'}
      </SectionLabel>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !tournaments?.length ? (
        <EmptyState
          message="No tournaments scheduled yet"
          hint="An admin will add tournaments to this season."
        />
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Card key={t.id} className="p-4 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: t.status === 'completed' ? '#2d6a35' : '#c8e0ca' }}
              />
              <div className="pl-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[15px] text-green-dark">{t.name}</p>
                    {t.status === 'completed' && t.course ? (
                      <p className="font-sans text-xs text-green-mid mt-0.5">
                        {t.course}{t.date ? ` · ${t.date}` : ''}
                      </p>
                    ) : (
                      <p className="font-sans text-xs text-green-mid mt-0.5">
                        {t.date ?? 'Not yet played'}
                      </p>
                    )}
                    <p className="font-sans text-xs text-green-mid mt-0.5">
                      1st: {t.points_1st}pts · 2nd: {t.points_2nd}pts · 3rd: {t.points_3rd}pts
                      {t.rounds > 1 && ` · ${t.rounds} rounds`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusPill status={t.status} />
                    {t.course_rating != null && t.course_rating > 0 && (
                      <StarRating value={t.course_rating} symbol="⛳" />
                    )}
                  </div>
                </div>
                {t.status === 'completed' && scores && players && (
                  <ResultRows tournament={t} scores={scores} players={players} />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
