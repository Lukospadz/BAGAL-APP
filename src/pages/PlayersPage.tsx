import { Link } from 'react-router-dom'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Card } from '@/components/ui/Card'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { StarRating } from '@/components/ui/StarRating'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePlayers } from '@/hooks/usePlayers'
import { useAllPersonalRounds } from '@/hooks/usePersonalRounds'
import { useProspectCourses, useAddProspectCourse, useDeleteProspectCourse } from '@/hooks/useProspectCourses'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

// ─── Compact player row ───────────────────────────────────────────────────────
function PlayerRow() {
  const { data: players } = usePlayers()
  if (!players?.length) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 mb-1">
      {players.map((p) => (
        <Link key={p.id} to={`/players/${p.id}`} className="flex flex-col items-center gap-1 flex-shrink-0">
          <PlayerAvatar
            name={p.name}
            initials={p.initials}
            color={p.color}
            avatarUrl={p.avatar_url}
            frame={p.active_frame}
            size="lg"
          />
          <span className="font-sans text-[10px] text-green-mid">{p.name.split(' ')[0]}</span>
          <span className="font-sans text-[10px] font-bold text-gold">{p.bagal_bucks.toLocaleString()} BB</span>
        </Link>
      ))}
    </div>
  )
}

// ─── Rounds feed ─────────────────────────────────────────────────────────────
function RoundsFeed() {
  const { data: rounds, isLoading } = useAllPersonalRounds()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-green-pale/50 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!rounds?.length) {
    return (
      <p className="font-serif italic text-green-mid text-sm text-center py-6">
        No rounds logged yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {rounds.map((r) => {
        const overUnder = r.score != null && r.par != null ? r.score - r.par : null
        return (
          <Card key={r.id} className="px-4 py-3 flex items-start gap-3">
            <Link to={`/players/${r.players.id}`} className="flex-shrink-0 mt-0.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold text-white"
                style={{ backgroundColor: r.players.color }}
              >
                {r.players.initials}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-serif text-sm text-green-dark">{r.course}</p>
                <p className="font-sans text-[11px] text-green-mid/60 flex-shrink-0">{r.date}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-sans text-[11px] text-green-mid">{r.players.name}</span>
                {r.score != null && (
                  <span className="font-sans text-[11px] font-semibold text-green-dark">
                    {r.score}
                    {overUnder != null && (
                      <span className="font-normal text-green-mid">
                        {' '}({overUnder > 0 ? `+${overUnder}` : overUnder})
                      </span>
                    )}
                  </span>
                )}
                {r.course_rating != null && r.course_rating > 0 && (
                  <StarRating value={r.course_rating} />
                )}
              </div>
              {r.notes && (
                <p className="font-sans text-xs text-green-mid/60 italic mt-0.5 truncate">{r.notes}</p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Bucket list ──────────────────────────────────────────────────────────────
function BucketList() {
  const { data: courses } = useProspectCourses()
  const { profile } = useAuth()
  const { data: players } = usePlayers()
  const addCourse = useAddProspectCourse()
  const deleteCourse = useDeleteProspectCourse()

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const myPlayerId = profile?.player_id

  async function handleAdd() {
    if (!name.trim() || !myPlayerId) return
    await addCourse.mutateAsync({
      playerId: myPlayerId,
      name: name.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
    })
    setName(''); setLocation(''); setNotes(''); setAdding(false)
  }

  return (
    <div>
      {!courses?.length && (
        <p className="font-serif italic text-green-mid text-sm text-center py-4">
          No courses on the list yet.
        </p>
      )}

      <div className="space-y-2 mb-3">
        {courses?.map((c) => {
          const suggester = players?.find(p => p.id === c.player_id)
          const canDelete = myPlayerId === c.player_id || profile?.role === 'admin'
          return (
            <Card key={c.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm text-green-dark">{c.name}</p>
                {c.location && (
                  <p className="font-sans text-xs text-green-mid">{c.location}</p>
                )}
                {c.notes && (
                  <p className="font-sans text-xs text-green-mid/70 italic mt-0.5">{c.notes}</p>
                )}
                {suggester && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center font-sans text-[8px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: suggester.color }}
                    >
                      {suggester.initials}
                    </div>
                    <span className="font-sans text-[10px] text-green-mid/60">{suggester.name}</span>
                  </div>
                )}
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteCourse.mutate(c.id)}
                  className="font-sans text-xs text-green-mid/40 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                >
                  ✕
                </button>
              )}
            </Card>
          )
        })}
      </div>

      {myPlayerId && !adding && (
        <button onClick={() => setAdding(true)} className="btn-ghost text-sm w-full">
          + Add a course
        </button>
      )}

      {adding && (
        <Card className="p-4 space-y-3">
          <div>
            <label className="field-label">Course name</label>
            <input className="field-input text-sm" placeholder="e.g. Augusta National"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Location (optional)</label>
            <input className="field-input text-sm" placeholder="e.g. Augusta, Georgia"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Notes (optional)</label>
            <input className="field-input text-sm" placeholder="e.g. Saw it on YouTube, looks insane"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {addCourse.isError && (
            <p className="font-sans text-xs text-red-600">{String(addCourse.error)}</p>
          )}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!name.trim() || addCourse.isPending} className="btn-primary text-sm flex-1">
              {addCourse.isPending ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setAdding(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function PlayersPage() {
  const { data: players, isLoading } = usePlayers()

  if (isLoading) {
    return (
      <div className="p-4 pt-2 space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-green-pale/50 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!players?.length) {
    return (
      <div className="p-4 pt-2">
        <EmptyState message="No players yet" hint="An admin will set up the player profiles." />
      </div>
    )
  }

  return (
    <div className="p-4 pt-2">
      <PlayerRow />
      <SectionLabel>Recent rounds</SectionLabel>
      <RoundsFeed />
      <SectionLabel>Bucket list</SectionLabel>
      <BucketList />
    </div>
  )
}
