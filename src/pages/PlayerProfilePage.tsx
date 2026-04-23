import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePlayer, useUpdatePlayer } from '@/hooks/usePlayers'
import { usePersonalRounds } from '@/hooks/usePersonalRounds'
import {
  useFavouriteCourses,
  useUpsertFavouriteCourse,
  useDeleteFavouriteCourse,
  useUploadCoursePhoto,
} from '@/hooks/useFavouriteCourses'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { StarRating } from '@/components/ui/StarRating'
import { Card } from '@/components/ui/Card'
import type { BagContents, FavouriteCourse } from '@/types/db'

// ─── Bag ──────────────────────────────────────────────────────────────────────
const BAG_SLOTS: { key: keyof BagContents; label: string; placeholder: string }[] = [
  { key: 'driver',  label: 'Driver',  placeholder: 'e.g. TaylorMade Stealth 2' },
  { key: 'woods',   label: '3W / 5W', placeholder: 'e.g. Titleist TSR2 3-Wood' },
  { key: 'irons',   label: 'Irons',   placeholder: 'e.g. Ping G425 4–PW' },
  { key: 'wedges',  label: 'Wedges',  placeholder: 'e.g. Vokey SM9 52°/56°/60°' },
  { key: 'putter',  label: 'Putter',  placeholder: 'e.g. Scotty Cameron Newport 2' },
  { key: 'ball',    label: 'Ball',    placeholder: 'e.g. Titleist Pro V1' },
  { key: 'notes',   label: 'Notes',   placeholder: 'Anything else in the bag…' },
]

function BagSection({ bag, editable, onSave }: {
  bag: BagContents
  editable: boolean
  onSave?: (bag: BagContents) => Promise<void>
}) {
  const [draft, setDraft] = useState<BagContents>({ ...bag })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const hasAnyClub = BAG_SLOTS.some((s) => !!(editable ? draft[s.key] : bag[s.key]))

  if (!editable && !hasAnyClub) {
    return (
      <p className="font-serif italic text-green-mid text-sm text-center py-8">
        No bag details yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {BAG_SLOTS.map(({ key, label, placeholder }) => {
        const val = editable ? draft[key] : bag[key]
        if (!editable && !val) return null
        return (
          <div key={key} className="flex items-start gap-3">
            <span className="font-sans text-[10px] tracking-widest uppercase text-green-mid/60 w-14 flex-shrink-0 pt-2">
              {label}
            </span>
            {editable ? (
              <input
                className="field-input flex-1"
                placeholder={placeholder}
                value={draft[key] ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.value || undefined }))
                }
              />
            ) : (
              <p className="font-serif text-sm text-green-dark pt-1.5">{val}</p>
            )}
          </div>
        )
      })}
      {editable && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full mt-2"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save bag'}
        </button>
      )}
    </div>
  )
}

// ─── Top 4 ────────────────────────────────────────────────────────────────────
function CourseSlot({
  rank,
  course,
  playerId,
  editable,
}: {
  rank: number
  course: FavouriteCourse | undefined
  playerId: string
  editable: boolean
}) {
  const upsert = useUpsertFavouriteCourse()
  const remove = useDeleteFavouriteCourse()
  const uploadPhoto = useUploadCoursePhoto()
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(course?.name ?? '')
  const [notes, setNotes] = useState(course?.notes ?? '')

  async function handleSave() {
    if (!name.trim()) return
    await upsert.mutateAsync({ playerId, rank, name: name.trim(), notes: notes.trim() || null, photoUrl: course?.photo_url })
    setEditing(false)
  }

  async function handleRemove() {
    if (!course) return
    await remove.mutateAsync({ id: course.id, playerId })
    setName('')
    setNotes('')
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !course) return
    const url = await uploadPhoto.mutateAsync({ playerId, rank, file })
    await upsert.mutateAsync({ playerId, rank, name: course.name, notes: course.notes, photoUrl: url })
  }

  const ordinals = ['1st', '2nd', '3rd', '4th']

  return (
    <div className="rounded-xl border border-green-pale overflow-hidden bg-white flex flex-col shadow-card">
      {/* Photo area */}
      <div className="relative h-32 bg-green-faint">
        {course?.photo_url ? (
          <img
            src={course.photo_url}
            alt={course.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="font-sans text-[10px] tracking-widest uppercase text-green-mid/40">
              {ordinals[rank - 1]}
            </span>
            {editable && (
              <span className="font-sans text-[10px] text-green-mid/40">No photo</span>
            )}
          </div>
        )}
        {editable && course && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="absolute bottom-2 right-2 bg-black/50 text-white font-sans text-[10px] px-2 py-1 rounded-md hover:bg-black/70 transition-colors"
          >
            {uploadPhoto.isPending ? 'Uploading…' : 'Photo'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      {/* Info area */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        {course && !editing ? (
          <>
            <p className="font-serif text-sm text-green-dark leading-tight">{course.name}</p>
            {course.notes && (
              <p className="font-sans text-xs text-green-mid/70 italic">{course.notes}</p>
            )}
            {editable && (
              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={() => { setName(course.name); setNotes(course.notes ?? ''); setEditing(true) }} className="btn-ghost text-xs py-1 px-2 flex-1">
                  Edit
                </button>
                <button onClick={handleRemove} disabled={remove.isPending} className="btn-danger text-xs py-1 px-2">
                  Remove
                </button>
              </div>
            )}
          </>
        ) : editable ? (
          <>
            <input
              className="field-input text-xs"
              placeholder="Course name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="field-input text-xs"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleSave}
                disabled={!name.trim() || upsert.isPending}
                className="btn-primary text-xs py-1 px-3 flex-1"
              >
                {upsert.isPending ? 'Saving…' : 'Save'}
              </button>
              {editing && (
                <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1 px-3">
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="font-sans text-xs text-green-mid/40 italic text-center py-2">Empty</p>
        )}
      </div>
    </div>
  )
}

function TopFourSection({ playerId, editable }: { playerId: string; editable: boolean }) {
  const { data: courses } = useFavouriteCourses(playerId)
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((rank) => (
        <CourseSlot
          key={rank}
          rank={rank}
          course={courses?.find((c) => c.rank === rank)}
          playerId={playerId}
          editable={editable}
        />
      ))}
    </div>
  )
}

// ─── Green Book ───────────────────────────────────────────────────────────────
function GreenBookSection({ playerId }: { playerId: string }) {
  const { data: rounds, isLoading } = usePersonalRounds(playerId)

  if (isLoading) return <div className="h-24 bg-green-pale/50 rounded-xl animate-pulse" />

  if (!rounds?.length) {
    return (
      <p className="font-serif italic text-green-mid text-sm text-center py-8">
        No rounds logged yet.
      </p>
    )
  }

  return (
    <Card className="divide-y divide-green-pale">
      {rounds.map((r) => {
        const overUnder = r.score != null && r.par != null ? r.score - r.par : null
        return (
          <div key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-green-dark">{r.course}</p>
              <p className="font-sans text-xs text-green-mid">
                {r.date}
                {r.score != null && (
                  <>
                    {' · '}
                    <span className="font-medium">{r.score}</span>
                    {overUnder != null && (
                      <span> ({overUnder > 0 ? `+${overUnder}` : overUnder})</span>
                    )}
                  </>
                )}
                {r.score != null && r.score < 90 && (
                  <span className="ml-1 text-gold font-medium">sub-90 ★</span>
                )}
              </p>
              {r.course_rating != null && r.course_rating > 0 && (
                <div className="mt-0.5">
                  <StarRating value={r.course_rating} />
                </div>
              )}
              {r.notes && (
                <p className="font-sans text-xs text-green-mid/60 italic mt-0.5">{r.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

// ─── Profile header ───────────────────────────────────────────────────────────
function ProfileHeader({
  playerId,
  showBucks,
}: {
  playerId: string
  showBucks: boolean
}) {
  const { data: player } = usePlayer(playerId)
  if (!player) return null
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4 shadow-card"
      style={{ background: `linear-gradient(160deg, #1a3d1f 60%, ${player.color}55)` }}
    >
      <div className="px-5 py-5 flex items-center gap-4">
        <div className="rounded-full bg-white/10 p-1">
          <PlayerAvatar
            name={player.name}
            initials={player.initials}
            color={player.color}
            avatarUrl={player.avatar_url}
            frame={player.active_frame}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-xl text-cream leading-tight">{player.name}</p>
          {player.active_title && (
            <p className="font-sans text-xs text-gold italic mt-0.5">
              &ldquo;{player.active_title}&rdquo;
            </p>
          )}
          {player.home_course && (
            <p className="font-sans text-[11px] text-cream/50 mt-1">{player.home_course}</p>
          )}
          {showBucks && (
            <p className="font-sans text-[11px] text-cream/50 mt-1">
              <span className="text-gold font-bold">{player.bagal_bucks.toLocaleString()}</span>
              {' '}BAGAL Bucks
            </p>
          )}
        </div>
      </div>
      {player.bio && (
        <div className="px-5 pb-4">
          <p className="font-serif italic text-cream/70 text-sm border-t border-white/10 pt-3">
            &ldquo;{player.bio}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Shared profile tabs renderer ────────────────────────────────────────────
type ProfileTab = 'bag' | 'top4' | 'rounds'

function ProfileTabs({
  playerId,
  editable,
}: {
  playerId: string
  editable: boolean
}) {
  const [tab, setTab] = useState<ProfileTab>('top4')
  const { data: player } = usePlayer(playerId)
  const updatePlayer = useUpdatePlayer()

  const TABS: { key: ProfileTab; label: string }[] = [
    { key: 'top4',   label: 'Top 4 Courses' },
    { key: 'rounds', label: 'Green Book' },
    { key: 'bag',    label: 'The Bag' },
  ]

  return (
    <>
      <div className="flex gap-1 bg-green-faint rounded-lg p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 font-sans text-xs py-1.5 rounded-md transition-all',
              tab === t.key
                ? 'bg-green-dark text-cream shadow-sm'
                : 'text-green-mid hover:text-green-dark',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'top4' && <TopFourSection playerId={playerId} editable={editable} />}
      {tab === 'rounds' && <GreenBookSection playerId={playerId} />}
      {tab === 'bag' && player && (
        <BagSection
          bag={player.bag ?? {}}
          editable={editable}
          onSave={editable ? (bag) => updatePlayer.mutateAsync({ id: playerId, bag }) : undefined}
        />
      )}
    </>
  )
}

// ─── Public profile (read-only) ───────────────────────────────────────────────
export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { data: player, isLoading } = usePlayer(playerId)

  if (isLoading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="h-28 bg-green-dark/10 rounded-2xl animate-pulse mb-4" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card className="p-6 text-center">
          <p className="font-serif text-base text-green-dark">Player not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 pt-2 max-w-lg mx-auto">
      <ProfileHeader playerId={player.id} showBucks={false} />
      <ProfileTabs playerId={player.id} editable={false} />
    </div>
  )
}

// ─── Own profile (editable) ───────────────────────────────────────────────────
export { ProfileTabs, ProfileHeader, BagSection, TopFourSection, GreenBookSection }
