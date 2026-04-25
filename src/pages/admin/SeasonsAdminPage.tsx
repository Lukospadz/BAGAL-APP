import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useSeasons, useCreateSeason, useUpdateSeason, useDeleteSeason,
} from '@/hooks/useSeasons'
import {
  useTournaments, useCreateTournament, useUpdateTournament, useDeleteTournament,
} from '@/hooks/useTournaments'
import {
  useCasualRounds, useCreateCasualRound, useDeleteCasualRound,
} from '@/hooks/useCasualRounds'
import { usePlayers } from '@/hooks/usePlayers'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import type { Season, Tournament, Player } from '@/types/db'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const seasonSchema = z.object({
  name:               z.string().min(1, 'Required').trim(),
  year:               z.coerce.number().int().min(2020).max(2099),
  status:             z.enum(['active', 'completed']),
  champion_player_id: z.string().optional(),
})

const tournamentSchema = z.object({
  name:       z.string().min(1, 'Required').trim(),
  format:     z.enum(['stroke', 'match', 'scramble']),
  rounds:     z.number().int(),
  holes:      z.number().int(),
  par:        z.number().int().min(27).max(90).optional(),
  points_1st: z.number().int().min(0),
  points_2nd: z.number().int().min(0),
  points_3rd: z.number().int().min(0),
  sort_order: z.number().int().min(0),
  notes:      z.string().optional(),
})

type SeasonFormValues = z.infer<typeof seasonSchema>
type TournamentFormValues = z.infer<typeof tournamentSchema>

// ─── New / Edit Season Form ───────────────────────────────────────────────────

function SeasonForm({
  existing,
  players,
  onDone,
}: {
  existing?: Season
  players: Player[]
  onDone: () => void
}) {
  const createSeason = useCreateSeason()
  const updateSeason = useUpdateSeason()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          year: existing.year,
          status: existing.status,
          champion_player_id: existing.champion_player_id ?? '',
        }
      : { status: 'active', year: new Date().getFullYear() },
  })

  const onSubmit = handleSubmit(async (data) => {
    const champion = data.champion_player_id || null
    if (existing) {
      await updateSeason.mutateAsync({
        id: existing.id,
        name: data.name,
        year: data.year,
        status: data.status,
        champion_player_id: champion,
      })
    } else {
      await createSeason.mutateAsync({
        name: data.name,
        year: data.year,
        start_date: null,
        end_date: null,
        status: data.status,
      })
    }
    onDone()
  })

  const saving = createSeason.isPending || updateSeason.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="field-label">Season name</label>
          <input className="field-input" placeholder="Season 4" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="field-label">Year</label>
          <input type="number" className="field-input" {...register('year')} />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select className="field-select" {...register('status')}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {existing && (
        <div>
          <label className="field-label">Season champion (optional)</label>
          <select className="field-select" {...register('champion_player_id')}>
            <option value="">None</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || isSubmitting} className="btn-primary text-sm">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Create season'}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost text-sm">Cancel</button>
      </div>
    </form>
  )
}

// ─── Tournament inline form ───────────────────────────────────────────────────

function TournamentInlineForm({
  seasonId,
  existing,
  defaultSortOrder,
  onDone,
}: {
  seasonId: string
  existing?: Tournament
  defaultSortOrder?: number
  onDone: () => void
}) {
  const createTournament = useCreateTournament()
  const updateTournament = useUpdateTournament()

  const { register, handleSubmit, formState: { errors } } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: existing
      ? {
          name: existing.name, format: existing.format, rounds: existing.rounds,
          holes: existing.holes, par: existing.par ?? undefined,
          points_1st: existing.points_1st, points_2nd: existing.points_2nd,
          points_3rd: existing.points_3rd, sort_order: existing.sort_order,
          notes: existing.notes ?? '',
        }
      : {
          format: 'stroke', rounds: 1, holes: 18,
          points_1st: 20, points_2nd: 10, points_3rd: 5,
          sort_order: defaultSortOrder ?? 0,
        },
  })

  const onSubmit = handleSubmit(async (data) => {
    const par   = data.par != null && !isNaN(data.par) ? data.par : null
    const notes = data.notes?.trim() || null
    if (existing) {
      await updateTournament.mutateAsync({ id: existing.id, ...data, par, notes })
    } else {
      await createTournament.mutateAsync({
        season_id: seasonId, name: data.name, format: data.format,
        rounds: data.rounds, holes: data.holes, par, notes,
        points_1st: data.points_1st, points_2nd: data.points_2nd,
        points_3rd: data.points_3rd, sort_order: data.sort_order,
        date: null, course: null, course_rating: null,
        status: 'upcoming', bucks_awarded: false,
      })
    }
    onDone()
  })

  const saving = createTournament.isPending || updateTournament.isPending
  const error  = createTournament.error ?? updateTournament.error

  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-2">
      <div>
        <label className="field-label">Tournament name</label>
        <input className="field-input" placeholder="BAGAL Open" {...register('name')} />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Format</label>
          <select className="field-select" {...register('format')}>
            <option value="stroke">Stroke</option>
            <option value="match">Match</option>
            <option value="scramble">Scramble</option>
          </select>
        </div>
        <div>
          <label className="field-label">Rounds</label>
          <select className="field-select" {...register('rounds', { valueAsNumber: true })}>
            <option value={1}>1 round</option>
            <option value={4}>4 rounds (Masters)</option>
          </select>
        </div>
        <div>
          <label className="field-label">Holes</label>
          <select className="field-select" {...register('holes', { valueAsNumber: true })}>
            <option value={18}>18 holes</option>
            <option value={9}>9 holes</option>
          </select>
        </div>
        <div>
          <label className="field-label">Par (optional)</label>
          <input type="number" min={27} max={90} className="field-input"
            {...register('par', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <label className="field-label">Points (1st / 2nd / 3rd)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['points_1st', 'points_2nd', 'points_3rd'] as const).map((f) => (
            <input key={f} type="number" min={0} className="field-input text-center"
              {...register(f, { valueAsNumber: true })} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Display order</label>
          <input type="number" min={0} className="field-input"
            {...register('sort_order', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="field-label">Notes</label>
          <input className="field-input" placeholder="Optional" {...register('notes')} />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{String(error)}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Add tournament'}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost text-sm">Cancel</button>
      </div>
    </form>
  )
}

// ─── Casual rounds subsection ─────────────────────────────────────────────────

function CasualRoundsSection({ seasonId, players }: { seasonId: string; players: Player[] }) {
  const { data: rounds, isLoading } = useCasualRounds(seasonId)
  const createRound = useCreateCasualRound()
  const deleteRound = useDeleteCasualRound()

  const [winnerId, setWinnerId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [course, setCourse] = useState('')

  async function handleAdd() {
    if (!winnerId) return
    await createRound.mutateAsync({
      season_id: seasonId, winner_player_id: winnerId, date,
      course: course.trim() || null, points_awarded: 5, notes: null,
    })
    setWinnerId(''); setCourse('')
  }

  const winner = players.find((p) => p.id === winnerId)

  return (
    <div className="space-y-3">
      {/* Award form */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="field-input text-sm" value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Course (optional)</label>
            <input className="field-input text-sm" placeholder="Course name" value={course}
              onChange={(e) => setCourse(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label">Winner</label>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {players.map((p) => (
              <button key={p.id} type="button" onClick={() => setWinnerId(p.id)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-sans text-xs transition-all',
                  winnerId === p.id
                    ? 'border-green-dark bg-green-dark text-cream'
                    : 'border-green-pale bg-white text-green-dark hover:bg-green-faint',
                ].join(' ')}
              >
                <PlayerAvatar name={p.name} initials={p.initials} color={p.color}
                  avatarUrl={p.avatar_url} size="sm" />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleAdd} disabled={!winnerId || createRound.isPending}
          className="btn-primary text-sm w-full">
          {createRound.isPending ? 'Saving…'
            : winner ? `Award +5 to ${winner.name}` : 'Select a winner'}
        </button>
      </div>

      {/* Log */}
      {isLoading ? (
        <div className="h-10 bg-green-pale/50 rounded animate-pulse" />
      ) : rounds?.length ? (
        <div className="divide-y divide-green-pale border border-green-pale rounded-xl overflow-hidden">
          {rounds.map((r) => {
            const player = players.find((p) => p.id === r.winner_player_id)
            return (
              <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-white">
                {player && (
                  <PlayerAvatar name={player.name} initials={player.initials}
                    color={player.color} avatarUrl={player.avatar_url} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-green-dark">
                    {player?.name ?? '—'}
                    <span className="text-green-mid ml-1.5">+{r.points_awarded} pts</span>
                  </p>
                  <p className="font-sans text-xs text-green-mid">
                    {r.date}{r.course ? ` · ${r.course}` : ''}
                  </p>
                </div>
                <ConfirmButton
                  onConfirm={() => deleteRound.mutateAsync({ id: r.id, seasonId })}
                  isPending={deleteRound.isPending}
                  confirmLabel="Delete"
                  className="btn-danger text-xs py-0.5 px-2"
                >
                  Delete
                </ConfirmButton>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="font-sans text-xs text-green-mid italic">No casual bonuses this season.</p>
      )}
    </div>
  )
}

// ─── Season accordion item ────────────────────────────────────────────────────

function SeasonAccordionItem({
  season,
  isExpanded,
  onToggle,
  players,
}: {
  season: Season
  isExpanded: boolean
  onToggle: () => void
  players: Player[]
}) {
  const [isEditing, setIsEditing]             = useState(false)
  const [editingTournId, setEditingTournId]   = useState<string | null>(null)
  const [showAddTourn, setShowAddTourn]       = useState(false)
  const [showCasual, setShowCasual]           = useState(false)

  const { data: tournaments } = useTournaments(isExpanded ? season.id : undefined)
  const deleteTournament = useDeleteTournament()
  const deleteSeason = useDeleteSeason()

  const champion = players.find((p) => p.id === season.champion_player_id)

  return (
    <div className="border border-green-pale rounded-2xl overflow-hidden bg-white">
      {/* Season header row */}
      {isEditing ? (
        <div className="p-4">
          <SeasonForm existing={season} players={players} onDone={() => setIsEditing(false)} />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={onToggle}
            className="flex-1 flex items-center gap-2 min-w-0 text-left"
          >
            <span className="font-serif text-base text-green-dark">{season.name}</span>
            <StatusPill status={season.status} />
            {champion && (
              <span className="font-sans text-xs text-gold hidden sm:inline">
                🏆 {champion.name}
              </span>
            )}
            <span className="font-sans text-xs text-green-mid/60 ml-auto mr-2">{season.year}</span>
            <span className="text-green-mid text-sm">{isExpanded ? '▲' : '▼'}</span>
          </button>
          <button
            onClick={() => { setIsEditing(true); if (!isExpanded) onToggle() }}
            className="font-sans text-xs text-green-mid hover:text-green-dark px-2 py-1 rounded transition-colors flex-shrink-0"
          >
            Edit
          </button>
          <ConfirmButton
            onConfirm={() => deleteSeason.mutateAsync(season.id)}
            isPending={deleteSeason.isPending}
            confirmLabel="Delete season"
            className="btn-danger text-xs py-1 px-2"
          >
            Delete
          </ConfirmButton>
        </div>
      )}

      {/* Accordion content */}
      {isExpanded && !isEditing && (
        <div className="border-t border-green-pale">
          {/* Tournaments section */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="font-sans text-xs font-semibold uppercase tracking-widest text-green-mid">
                Tournaments
              </p>
              {!showAddTourn && (
                <button
                  onClick={() => setShowAddTourn(true)}
                  className="btn-primary text-xs py-1 px-3"
                >
                  + Add
                </button>
              )}
            </div>

            {/* Inline add form */}
            {showAddTourn && (
              <Card className="p-4" variant="tinted">
                <p className="font-serif text-sm text-green-dark mb-1">New tournament</p>
                <TournamentInlineForm
                  seasonId={season.id}
                  defaultSortOrder={tournaments?.length ?? 0}
                  onDone={() => setShowAddTourn(false)}
                />
              </Card>
            )}

            {/* Tournament rows */}
            {tournaments?.length ? (
              <div className="space-y-1.5">
                {tournaments.map((t) => (
                  <div key={t.id}>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-green-pale">
                      {/* Left accent */}
                      <div
                        className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ background: t.status === 'completed' ? '#2d6a35' : '#c8e0ca' }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-serif text-sm text-green-dark">{t.name}</p>
                          <StatusPill status={t.status} />
                        </div>
                        <p className="font-sans text-xs text-green-mid mt-0.5">
                          {t.format} · {t.holes}h
                          {t.date ? ` · ${t.date}` : ''}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <Link
                          to={`/admin/seasons/${season.id}/tournaments/${t.id}/scores`}
                          className="btn-primary text-xs py-1 px-2.5"
                        >
                          {t.status === 'completed' ? 'Scores' : 'Enter'}
                        </Link>
                        <Link
                          to={`/admin/seasons/${season.id}/tournaments/${t.id}/props`}
                          className="btn-ghost text-xs py-1 px-2.5"
                        >
                          Props
                        </Link>
                        <button
                          onClick={() => setEditingTournId(editingTournId === t.id ? null : t.id)}
                          className="btn-ghost text-xs py-1 px-2.5"
                        >
                          {editingTournId === t.id ? 'Cancel' : 'Edit'}
                        </button>
                        <ConfirmButton
                          onConfirm={() => deleteTournament.mutateAsync({ id: t.id, seasonId: season.id })}
                          isPending={deleteTournament.isPending}
                          confirmLabel="Delete"
                          className="btn-danger text-xs py-1 px-2"
                        >
                          Del
                        </ConfirmButton>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingTournId === t.id && (
                      <Card className="px-4 pb-4 pt-2 rounded-t-none border-t-0 -mt-1" variant="tinted">
                        <TournamentInlineForm
                          seasonId={season.id}
                          existing={t}
                          onDone={() => setEditingTournId(null)}
                        />
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-sans text-xs text-green-mid italic px-1">
                No tournaments yet — add the first one.
              </p>
            )}
          </div>

          {/* Casual rounds subsection */}
          <div className="border-t border-green-pale">
            <button
              onClick={() => setShowCasual(!showCasual)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-green-faint/50 transition-colors"
            >
              <span className="font-sans text-xs font-semibold uppercase tracking-widest text-green-mid">
                Casual rounds
              </span>
              <span className="text-green-mid text-sm">{showCasual ? '▲' : '▼'}</span>
            </button>

            {showCasual && (
              <div className="px-4 pb-4">
                <CasualRoundsSection seasonId={season.id} players={players} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SeasonsAdminPage() {
  const { data: seasons, isLoading } = useSeasons()
  const { data: players } = usePlayers()
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  // Auto-expand the active season on first load
  useEffect(() => {
    if (expandedId !== null) return
    const active = seasons?.find((s) => s.status === 'active')
    if (active) setExpandedId(active.id)
    else if (seasons?.length) setExpandedId(seasons[0].id)
  }, [seasons, expandedId])

  const sorted = [...(seasons ?? [])].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (b.status === 'active' && a.status !== 'active') return 1
    return b.year - a.year
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-dark">Seasons</h2>
        {!showNewForm && (
          <button onClick={() => setShowNewForm(true)} className="btn-primary">
            + New season
          </button>
        )}
      </div>

      {showNewForm && (
        <Card className="p-4 mb-4">
          <p className="font-serif text-base text-green-dark mb-3">New season</p>
          <SeasonForm players={players ?? []} onDone={() => setShowNewForm(false)} />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-green-pale/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !sorted.length ? (
        <Card className="p-6 text-center">
          <p className="font-serif italic text-green-mid">No seasons yet — create the first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => (
            <SeasonAccordionItem
              key={s.id}
              season={s}
              isExpanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              players={players ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
