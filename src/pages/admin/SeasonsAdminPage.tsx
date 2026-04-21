import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSeasons, useCreateSeason, useDeleteSeason } from '@/hooks/useSeasons'
import { Card } from '@/components/ui/Card'
import { StatusPill } from '@/components/ui/StatusPill'

const seasonSchema = z.object({
  name:       z.string().min(1, 'Name is required').trim(),
  year:       z.coerce.number().int().min(2020).max(2099),
  start_date: z.string().optional(),
  status:     z.enum(['active', 'completed']),
})
type FormValues = z.infer<typeof seasonSchema>

export function SeasonsAdminPage() {
  const { data: seasons, isLoading } = useSeasons()
  const createSeason = useCreateSeason()
  const deleteSeason = useDeleteSeason()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: { status: 'active', year: new Date().getFullYear() },
  })

  async function onSubmit(data: FormValues) {
    await createSeason.mutateAsync({
      name: data.name,
      year: data.year,
      start_date: data.start_date || null,
      end_date: null,
      status: data.status,
    })
    reset()
    setShowForm(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All tournaments and scores in this season will also be deleted.`)) return
    await deleteSeason.mutateAsync(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-dark">Seasons</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + New season
          </button>
        )}
      </div>

      {showForm && (
        <Card className="p-5 mb-5 max-w-lg">
          <h3 className="font-serif text-base text-green-dark mb-4">New season</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className="field-label">Season name</label>
              <input className="field-input" placeholder="Season 4" {...register('name')} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Year</label>
                <input type="number" className="field-input" {...register('year')} />
                {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year.message}</p>}
              </div>
              <div>
                <label className="field-label">Status</label>
                <select className="field-select" {...register('status')}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="field-label">Start date (optional)</label>
              <input type="date" className="field-input" {...register('start_date')} />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving…' : 'Create season'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !seasons?.length ? (
        <Card className="p-6 text-center">
          <p className="font-serif italic text-green-mid">No seasons yet — create the first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {seasons.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-base text-green-dark">{s.name}</p>
                  <StatusPill status={s.status} />
                </div>
                <p className="font-sans text-xs text-green-mid">
                  {s.year}
                  {s.start_date ? ` · from ${s.start_date}` : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  to={`/admin/seasons/${s.id}`}
                  className="btn-ghost text-xs py-1 px-3"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  disabled={deleteSeason.isPending}
                  className="btn-danger text-xs py-1 px-3"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
