import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTournament } from '@/hooks/useTournaments'
import { usePlayers } from '@/hooks/usePlayers'
import { useScoresByTournament, useUpsertScores, useDeleteTournamentScores } from '@/hooks/useScores'
import { useSeason } from '@/hooks/useSeasons'
import { computeTournamentPositions } from '@/lib/scoring'
import { StarRating } from '@/components/ui/StarRating'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/types/db'

export function ScoreEntryPage() {
  const { seasonId, tournamentId } = useParams<{ seasonId: string; tournamentId: string }>()
  const navigate = useNavigate()

  const { data: tournament } = useTournament(tournamentId)
  const { data: season } = useSeason(seasonId)
  const { data: players } = usePlayers()
  const { data: existingScores } = useScoresByTournament(tournamentId)
  const upsertScores = useUpsertScores()
  const deleteScores = useDeleteTournamentScores()

  const rounds = tournament?.rounds ?? 1

  // scores[playerId][roundIndex] = gross score string
  const [scores, setScores] = useState<Record<string, string[]>>({})
  const [course, setCourse] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [courseRating, setCourseRating] = useState(0)
  const [notes, setNotes] = useState('')

  // Pre-fill from existing scores
  useEffect(() => {
    if (!existingScores?.length || !players?.length) return
    const filled: Record<string, string[]> = {}
    for (const player of players) {
      const playerScores = existingScores
        .filter((s) => s.player_id === player.id)
        .sort((a, b) => a.round_number - b.round_number)
      filled[player.id] = playerScores.map((s) => String(s.gross_score))
    }
    setScores(filled)
    if (tournament?.course) setCourse(tournament.course)
    if (tournament?.date) setDate(tournament.date)
    if (tournament?.course_rating) setCourseRating(tournament.course_rating)
  }, [existingScores, players, tournament])

  function setScore(playerId: string, roundIdx: number, value: string) {
    setScores((prev) => {
      const playerScores = [...(prev[playerId] ?? Array(rounds).fill(''))]
      playerScores[roundIdx] = value
      return { ...prev, [playerId]: playerScores }
    })
  }

  // Compute live preview
  const preview = (() => {
    if (!players || !tournament) return null
    const entries = players.map((p) => {
      const playerScores = scores[p.id] ?? []
      const roundScores = playerScores.map((v) => parseInt(v)).filter((n) => !isNaN(n))
      return { playerId: p.id, roundScores }
    })
    const complete = entries.filter((e) => e.roundScores.length === rounds)
    if (complete.length < 2) return null
    return computeTournamentPositions(players, complete, tournament)
  })()

  function getPlayerName(id: string) {
    return players?.find((p) => p.id === id)?.name ?? id
  }

  const allFilled = players?.every((p) => {
    const ps = scores[p.id] ?? []
    return ps.length === rounds && ps.every((v) => v !== '' && !isNaN(parseInt(v)))
  })

  async function handleSave() {
    if (!players || !tournament || !preview) return

    const entries = preview.map(({ playerId, position, pointsAwarded }) => {
      const roundScores = (scores[playerId] ?? []).map((v) => parseInt(v))
      return { playerId, roundScores, position, pointsAwarded }
    })

    // Update tournament meta
    await supabase
      .from('tournaments')
      .update({
        course: course.trim() || null,
        date,
        course_rating: courseRating || null,
        notes: notes.trim() || null,
      })
      .eq('id', tournament.id)

    await upsertScores.mutateAsync({
      tournamentId: tournament.id,
      seasonId: seasonId!,
      entries,
    })

    navigate(`/admin/seasons/${seasonId}`)
  }

  async function handleDelete() {
    if (!confirm('Delete all scores for this tournament and mark it as upcoming again?')) return
    await deleteScores.mutateAsync({ tournamentId: tournamentId!, seasonId: seasonId! })
    navigate(`/admin/seasons/${seasonId}`)
  }

  if (!tournament || !players) {
    return <div className="h-8 w-48 bg-green-pale/50 rounded animate-pulse" />
  }

  return (
    <div>
      <div className="mb-1">
        <Link to={`/admin/seasons/${seasonId}`} className="font-sans text-xs text-green-mid hover:underline">
          ← Back to {season?.name ?? 'season'}
        </Link>
      </div>
      <h2 className="font-serif text-xl text-green-dark mb-4">{tournament.name} — Scores</h2>

      <div className="space-y-4 max-w-lg">
        {/* Tournament meta */}
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Course</label>
              <input
                className="field-input"
                placeholder="Heron Point Golf Links"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Date played</label>
              <input
                type="date"
                className="field-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Course rating</label>
            <StarRating value={courseRating} onChange={setCourseRating} />
          </div>

          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea
              rows={2}
              className="field-input resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Card>

        {/* Score inputs */}
        <Card className="p-4">
          <p className="field-label mb-3">
            Stroke scores — lowest total wins
            {rounds > 1 && ` (${rounds} rounds)`}
          </p>

          <div className="space-y-4">
            {players.map((player) => (
              <PlayerScoreRow
                key={player.id}
                player={player}
                rounds={rounds}
                values={scores[player.id] ?? Array(rounds).fill('')}
                onChange={(roundIdx, val) => setScore(player.id, roundIdx, val)}
              />
            ))}
          </div>
        </Card>

        {/* Live preview */}
        {preview && (
          <Card className="p-4" variant="tinted">
            <p className="field-label mb-2">Points preview</p>
            <div className="space-y-1">
              {preview.map(({ playerId, totalGross, position, pointsAwarded }) => (
                <div key={playerId} className="flex justify-between font-sans text-sm">
                  <span className="text-green-dark">
                    {position}. {getPlayerName(playerId)}
                    {rounds > 1 && (
                      <span className="text-green-mid text-xs ml-1">({totalGross} total)</span>
                    )}
                    {rounds === 1 && (
                      <span className="text-green-mid text-xs ml-1">
                        ({scores[playerId]?.[0]} strokes)
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-green-mid">
                    {pointsAwarded > 0 ? `+${pointsAwarded} pts` : '0 pts'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {upsertScores.isError && (
          <p className="font-sans text-xs text-red-600">{String(upsertScores.error)}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!allFilled || upsertScores.isPending}
            className="btn-primary flex-1"
          >
            {upsertScores.isPending ? 'Saving…' : 'Save result'}
          </button>

          {tournament.status === 'completed' && (
            <button
              onClick={handleDelete}
              disabled={deleteScores.isPending}
              className="btn-danger"
            >
              Delete result
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerScoreRow({
  player,
  rounds,
  values,
  onChange,
}: {
  player: Player
  rounds: number
  values: string[]
  onChange: (roundIdx: number, val: string) => void
}) {
  const total = values.reduce((sum, v) => {
    const n = parseInt(v)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  const hasAll = values.every((v) => v !== '' && !isNaN(parseInt(v)))

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: player.color }}
        >
          {player.initials}
        </div>
        <span className="font-serif text-sm text-green-dark">{player.name}</span>
        {rounds > 1 && hasAll && (
          <span className="font-sans text-xs text-green-mid ml-auto">Total: {total}</span>
        )}
      </div>
      <div className={`grid gap-2 ${rounds === 1 ? 'grid-cols-1' : 'grid-cols-4'}`}>
        {Array.from({ length: rounds }, (_, i) => (
          <div key={i}>
            {rounds > 1 && (
              <p className="font-sans text-[10px] text-green-mid mb-0.5 text-center">
                Round {i + 1}
              </p>
            )}
            <input
              type="number"
              inputMode="numeric"
              min={50}
              max={150}
              placeholder="—"
              className="field-input text-center text-lg font-serif"
              value={values[i] ?? ''}
              onChange={(e) => onChange(i, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
