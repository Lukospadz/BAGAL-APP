import { useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateTournament, useUpdateTournament, useTournament } from '@/hooks/useTournaments'
import { Card } from '@/components/ui/Card'

const tournamentSchema = z.object({
  name:        z.string().min(1, 'Name is required').trim(),
  format:      z.enum(['stroke', 'match', 'scramble']),
  rounds:      z.number().int(),
  holes:       z.number().int(),
  par:         z.number().int().min(27).max(90).optional(),
  points_1st:  z.number().int().min(0),
  points_2nd:  z.number().int().min(0),
  points_3rd:  z.number().int().min(0),
  sort_order:  z.number().int().min(0),
  notes:       z.string().optional(),
})
type FormValues = z.infer<typeof tournamentSchema>

export function TournamentFormPage() {
  const { seasonId, tournamentId } = useParams<{ seasonId: string; tournamentId?: string }>()
  const navigate = useNavigate()
  const isEdit = !!tournamentId

  const { data: existing } = useTournament(tournamentId)
  const createTournament = useCreateTournament()
  const updateTournament = useUpdateTournament()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      format:      'stroke',
      rounds:      1,
      holes:       18,
      points_1st:  20,
      points_2nd:  10,
      points_3rd:  5,
      sort_order:  0,
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        name:       existing.name,
        format:     existing.format,
        rounds:     existing.rounds,
        holes:      existing.holes,
        par:        existing.par ?? undefined,
        points_1st: existing.points_1st,
        points_2nd: existing.points_2nd,
        points_3rd: existing.points_3rd,
        sort_order: existing.sort_order,
        notes:      existing.notes ?? '',
      })
    }
  }, [existing, reset])

  const onSubmit = handleSubmit(async (data) => {
    const par   = data.par !== undefined && !isNaN(data.par) ? data.par : null
    const notes = data.notes?.trim() || null

    if (isEdit && existing) {
      await updateTournament.mutateAsync({
        id: existing.id,
        name: data.name,
        format: data.format,
        rounds: data.rounds,
        holes: data.holes,
        par,
        points_1st: data.points_1st,
        points_2nd: data.points_2nd,
        points_3rd: data.points_3rd,
        sort_order: data.sort_order,
        notes,
      })
    } else {
      await createTournament.mutateAsync({
        season_id:    seasonId!,
        name:         data.name,
        format:       data.format,
        rounds:       data.rounds,
        holes:        data.holes,
        par,
        points_1st:   data.points_1st,
        points_2nd:   data.points_2nd,
        points_3rd:   data.points_3rd,
        sort_order:   data.sort_order,
        notes,
        date:         null,
        course:       null,
        course_rating:  null,
        status:         'upcoming',
        bucks_awarded:  false,
      })
    }
    navigate(`/admin/seasons/${seasonId}`)
  })

  const saving = createTournament.isPending || updateTournament.isPending
  const error  = createTournament.error ?? updateTournament.error

  return (
    <div>
      <div className="mb-1">
        <Link
          to={`/admin/seasons/${seasonId}`}
          className="font-sans text-xs text-green-mid hover:underline"
        >
          ← Back to season
        </Link>
      </div>
      <h2 className="font-serif text-xl text-green-dark mb-4">
        {isEdit ? `Edit ${existing?.name ?? 'tournament'}` : 'New tournament'}
      </h2>

      <Card className="p-5 max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="field-label">Tournament name</label>
            <input className="field-input" placeholder="BAGAL Open" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Format</label>
              <select className="field-select" {...register('format')}>
                <option value="stroke">Stroke play</option>
                <option value="match">Match play</option>
                <option value="scramble">Scramble</option>
              </select>
            </div>
            <div>
              <label className="field-label">Rounds</label>
              <select className="field-select" {...register('rounds', { valueAsNumber: true })}>
                <option value={1}>1 round</option>
                <option value={4}>4 rounds (Masters)</option>
              </select>
              {errors.rounds && <p className="text-xs text-red-600 mt-1">{errors.rounds.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Holes</label>
              <select className="field-select" {...register('holes', { valueAsNumber: true })}>
                <option value={18}>18 holes</option>
                <option value={9}>9 holes</option>
              </select>
            </div>
            <div>
              <label className="field-label">Par (optional)</label>
              <input
                type="number"
                min={27}
                max={90}
                className="field-input"
                {...register('par', { valueAsNumber: true })}
              />
              {errors.par && <p className="text-xs text-red-600 mt-1">{errors.par.message}</p>}
            </div>
          </div>

          <div>
            <label className="field-label">Points</label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ['1st place', 'points_1st'],
                  ['2nd place', 'points_2nd'],
                  ['3rd place', 'points_3rd'],
                ] as const
              ).map(([label, field]) => (
                <div key={field}>
                  <label className="field-label text-[10px]">{label}</label>
                  <input
                    type="number"
                    min={0}
                    className="field-input text-center"
                    {...register(field, { valueAsNumber: true })}
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-600 mt-1">{errors[field]?.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Display order</label>
            <input
              type="number"
              min={0}
              className="field-input w-24"
              {...register('sort_order', { valueAsNumber: true })}
            />
            <p className="font-sans text-[11px] text-green-mid mt-1">Lower numbers appear first.</p>
          </div>

          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea rows={2} className="field-input resize-none" {...register('notes')} />
          </div>

          {error && (
            <p className="font-sans text-xs text-red-600">{String(error)}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create tournament'}
            </button>
            <Link to={`/admin/seasons/${seasonId}`} className="btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
