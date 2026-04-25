import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/usePlayers'
import { useAdminResetPlayerBucks } from '@/hooks/useBucks'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import type { Player } from '@/types/db'

const PRESET_COLORS = [
  '#185FA5', '#0F6E56', '#854F0B', '#6B3FA0', '#B5451B', '#1A6B6B',
]

const playerSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  initials: z.string().min(1).max(3, 'Max 3 characters'),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour'),
  handicap: z.number().min(0).max(54).optional(),
})
type FormValues = z.infer<typeof playerSchema>

function PlayerFormFields({
  register,
  errors,
  selectedColor,
  setValue,
}: {
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors']
  selectedColor: string
  setValue: ReturnType<typeof useForm<FormValues>>['setValue']
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="field-label">Name</label>
          <input className="field-input" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="field-label">Initials</label>
          <input className="field-input uppercase" maxLength={3} {...register('initials')} />
          {errors.initials && <p className="text-xs text-red-600 mt-1">{errors.initials.message}</p>}
        </div>
        <div>
          <label className="field-label">Handicap (optional)</label>
          <input type="number" step="0.1" min="0" max="54" className="field-input"
            {...register('handicap', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <label className="field-label">Avatar colour</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setValue('color', c)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: selectedColor === c ? '#fff' : 'transparent',
                outline: selectedColor === c ? '2px solid #2d6a35' : 'none',
              }}
              aria-label={c}
            />
          ))}
          <input type="color" className="w-8 h-8 rounded cursor-pointer border border-green-pale"
            {...register('color')} />
        </div>
      </div>
    </div>
  )
}

function PlayerInlineForm({ existing, onDone }: { existing?: Player; onDone: () => void }) {
  const createPlayer = useCreatePlayer()
  const updatePlayer = useUpdatePlayer()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: existing
      ? { name: existing.name, initials: existing.initials, color: existing.color, handicap: existing.handicap ?? undefined }
      : { color: '#185FA5' },
  })

  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (data) => {
    if (existing) {
      await updatePlayer.mutateAsync({
        id: existing.id,
        name: data.name, initials: data.initials,
        color: data.color, handicap: data.handicap ?? null,
      })
    } else {
      await createPlayer.mutateAsync({
        name: data.name, initials: data.initials, color: data.color,
        handicap: data.handicap ?? null, avatar_url: null, bio: null,
        home_course: null, bag: [], bagal_bucks: 0,
        active_title: null, active_frame: null,
      })
    }
    onDone()
  })

  const saving = createPlayer.isPending || updatePlayer.isPending
  const error  = createPlayer.error ?? updatePlayer.error

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <PlayerFormFields register={register} errors={errors} selectedColor={selectedColor} setValue={setValue} />
      {error && <p className="text-xs text-red-600">{String(error)}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Add player'}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost text-sm">Cancel</button>
      </div>
    </form>
  )
}

export function PlayersAdminPage() {
  const { data: players, isLoading } = usePlayers()
  const deletePlayer = useDeletePlayer()
  const resetBucks   = useAdminResetPlayerBucks()
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-dark">Players</h2>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary">+ Add player</button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4 mb-3">
          <p className="font-serif text-base text-green-dark mb-3">New player</p>
          <PlayerInlineForm onDone={() => setShowAddForm(false)} />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-green-pale/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !players?.length ? (
        <Card className="p-6 text-center">
          <p className="font-serif italic text-green-mid">No players yet — add the first one.</p>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {players.map((p) => (
            <div key={p.id} className="border border-green-pale rounded-2xl overflow-hidden bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <PlayerAvatar name={p.name} initials={p.initials} color={p.color}
                  avatarUrl={p.avatar_url} frame={p.active_frame} />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base text-green-dark leading-tight">{p.name}</p>
                  <p className="font-sans text-xs text-green-mid">
                    {p.initials}
                    {p.handicap != null ? ` · HCP ${p.handicap}` : ''}
                    {' · '}
                    <span className="text-gold font-semibold">{p.bagal_bucks.toLocaleString()} BB</span>
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleExpand(p.id)} className="btn-ghost text-xs py-1 px-2.5">
                    {expandedId === p.id ? 'Cancel' : 'Edit'}
                  </button>
                  <ConfirmButton
                    onConfirm={() => resetBucks.mutateAsync(p.id)}
                    isPending={resetBucks.isPending}
                    confirmLabel="Reset BB"
                    className="font-sans text-xs py-1 px-2.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    Reset BB
                  </ConfirmButton>
                  <ConfirmButton
                    onConfirm={() => deletePlayer.mutateAsync(p.id)}
                    isPending={deletePlayer.isPending}
                    confirmLabel="Delete"
                    className="btn-danger text-xs py-1 px-2"
                  >
                    Del
                  </ConfirmButton>
                </div>
              </div>

              {expandedId === p.id && (
                <div className="border-t border-green-pale px-4 py-4 bg-green-faint/40">
                  <PlayerInlineForm existing={p} onDone={() => setExpandedId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
