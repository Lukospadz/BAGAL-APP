import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/usePlayers'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { Card } from '@/components/ui/Card'
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

// ─── Player Form (self-contained, handles own mutations) ──────────────────────

function CreatePlayerForm({ onDone }: { onDone: () => void }) {
  const createPlayer = useCreatePlayer()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: { color: '#185FA5' },
  })
  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (data) => {
    await createPlayer.mutateAsync({
      name: data.name,
      initials: data.initials,
      color: data.color,
      handicap: data.handicap ?? null,
      avatar_url: null,
      bio: null,
      home_course: null,
      bag: {},
      bagal_bucks: 0,
      active_title: null,
      active_frame: null,
    })
    onDone()
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PlayerFormFields
        register={register}
        errors={errors}
        selectedColor={selectedColor}
        setValue={setValue}
      />
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={createPlayer.isPending} className="btn-primary">
          {createPlayer.isPending ? 'Saving…' : 'Save player'}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>
      {createPlayer.isError && (
        <p className="text-xs text-red-600">{String(createPlayer.error)}</p>
      )}
    </form>
  )
}

function EditPlayerForm({ player, onDone }: { player: Player; onDone: () => void }) {
  const updatePlayer = useUpdatePlayer()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player.name,
      initials: player.initials,
      color: player.color,
      handicap: player.handicap ?? undefined,
    },
  })
  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (data) => {
    await updatePlayer.mutateAsync({
      id: player.id,
      name: data.name,
      initials: data.initials,
      color: data.color,
      handicap: data.handicap ?? null,
    })
    onDone()
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PlayerFormFields
        register={register}
        errors={errors}
        selectedColor={selectedColor}
        setValue={setValue}
      />
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={updatePlayer.isPending} className="btn-primary">
          {updatePlayer.isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
      </div>
      {updatePlayer.isError && (
        <p className="text-xs text-red-600">{String(updatePlayer.error)}</p>
      )}
    </form>
  )
}

// Shared field layout
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
    <>
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
          <input
            type="number"
            step="0.1"
            min="0"
            max="54"
            className="field-input"
            {...register('handicap', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Avatar colour</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: selectedColor === c ? '#fff' : 'transparent',
                outline: selectedColor === c ? '2px solid #2d6a35' : 'none',
              }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            className="w-8 h-8 rounded cursor-pointer border border-green-pale"
            {...register('color')}
          />
        </div>
        {errors.color && <p className="text-xs text-red-600 mt-1">{errors.color.message}</p>}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PlayersAdminPage() {
  const { data: players, isLoading } = usePlayers()
  const deletePlayer = useDeletePlayer()
  const [mode, setMode] = useState<'list' | 'create' | { edit: Player }>('list')

  async function handleDelete(player: Player) {
    if (!confirm(`Delete ${player.name}? This cannot be undone.`)) return
    await deletePlayer.mutateAsync(player.id)
  }

  if (mode === 'create') {
    return (
      <div>
        <h2 className="font-serif text-xl text-green-dark mb-4">New player</h2>
        <Card className="p-5 max-w-lg">
          <CreatePlayerForm onDone={() => setMode('list')} />
        </Card>
      </div>
    )
  }

  if (typeof mode === 'object' && 'edit' in mode) {
    return (
      <div>
        <h2 className="font-serif text-xl text-green-dark mb-4">Edit {mode.edit.name}</h2>
        <Card className="p-5 max-w-lg">
          <EditPlayerForm player={mode.edit} onDone={() => setMode('list')} />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl text-green-dark">Players</h2>
        <button onClick={() => setMode('create')} className="btn-primary">
          + Add player
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !players?.length ? (
        <Card className="p-6 text-center">
          <p className="font-serif italic text-green-mid">No players yet — add the first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {players.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-3">
              <PlayerAvatar
                name={p.name}
                initials={p.initials}
                color={p.color}
                avatarUrl={p.avatar_url}
              />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base text-green-dark">{p.name}</p>
                <p className="font-sans text-xs text-green-mid">
                  {p.initials}
                  {p.handicap != null ? ` · HCP ${p.handicap}` : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setMode({ edit: p })} className="btn-ghost text-xs py-1 px-3">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deletePlayer.isPending}
                  className="btn-danger text-xs py-1 px-3"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deletePlayer.isError && (
        <p className="mt-3 font-sans text-xs text-red-600">{String(deletePlayer.error)}</p>
      )}
    </div>
  )
}
