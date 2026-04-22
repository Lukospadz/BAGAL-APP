import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCasualRounds, useCreateCasualRound, useDeleteCasualRound } from '@/hooks/useCasualRounds'
import { usePlayers } from '@/hooks/usePlayers'
import { useSeason } from '@/hooks/useSeasons'
import { Card } from '@/components/ui/Card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'

export function CasualRoundsPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  const { data: season } = useSeason(seasonId)
  const { data: players } = usePlayers()
  const { data: rounds, isLoading } = useCasualRounds(seasonId)
  const createRound = useCreateCasualRound()
  const deleteRound = useDeleteCasualRound()

  const [winnerId, setWinnerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [course, setCourse] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    if (!winnerId || !seasonId) return
    await createRound.mutateAsync({
      season_id: seasonId,
      winner_player_id: winnerId,
      date,
      course: course.trim() || null,
      points_awarded: 5,
      notes: notes.trim() || null,
    })
    setWinnerId('')
    setCourse('')
    setNotes('')
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this casual round bonus?')) return
    await deleteRound.mutateAsync({ id, seasonId: seasonId! })
  }

  const winner = players?.find((p) => p.id === winnerId)

  return (
    <div>
      <div className="mb-1">
        <Link to={`/admin/seasons/${seasonId}`} className="font-sans text-xs text-green-mid hover:underline">
          ← Back to {season?.name ?? 'season'}
        </Link>
      </div>
      <h2 className="font-serif text-xl text-green-dark mb-4">Casual Round Bonuses</h2>

      <div className="grid gap-4 max-w-lg">
        {/* Award form */}
        <Card className="p-4 space-y-3">
          <p className="font-sans text-xs text-green-mid">
            Award +5 points to the best score in a non-tournament round.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Date</label>
              <input
                type="date"
                className="field-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Course (optional)</label>
              <input
                className="field-input"
                placeholder="Course name"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Winner</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {players?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWinnerId(p.id)}
                  className={[
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border font-sans text-sm transition-all',
                    winnerId === p.id
                      ? 'border-green-dark bg-green-dark text-cream'
                      : 'border-green-pale bg-white text-green-dark hover:bg-green-faint',
                  ].join(' ')}
                >
                  <PlayerAvatar
                    name={p.name}
                    initials={p.initials}
                    color={p.color}
                    avatarUrl={p.avatar_url}
                    size="sm"
                  />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Notes (optional)</label>
            <input
              className="field-input"
              placeholder="Any notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {createRound.isError && (
            <p className="font-sans text-xs text-red-600">{String(createRound.error)}</p>
          )}

          <button
            onClick={handleSave}
            disabled={!winnerId || createRound.isPending}
            className="btn-primary w-full"
          >
            {createRound.isPending
              ? 'Saving…'
              : winner
              ? `Award +5 to ${winner.name}`
              : 'Select a winner first'}
          </button>
        </Card>

        {/* Log */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-green-pale/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !rounds?.length ? (
          <p className="font-serif italic text-green-mid text-sm text-center py-4">
            No casual bonuses yet this season.
          </p>
        ) : (
          <Card className="divide-y divide-green-pale">
            {rounds.map((r) => {
              const player = players?.find((p) => p.id === r.winner_player_id)
              return (
                <div key={r.id} className="flex items-center gap-3 p-3">
                  {player && (
                    <PlayerAvatar
                      name={player.name}
                      initials={player.initials}
                      color={player.color}
                      avatarUrl={player.avatar_url}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-green-dark">
                      {player?.name ?? '—'}
                      <span className="text-green-mid font-medium ml-2">+{r.points_awarded} pts</span>
                    </p>
                    <p className="font-sans text-xs text-green-mid">
                      {r.date}{r.course ? ` · ${r.course}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="btn-danger text-xs py-1 px-2"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </Card>
        )}
      </div>
    </div>
  )
}
