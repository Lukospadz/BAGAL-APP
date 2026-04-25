import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePlayer, useUpdatePlayer, usePlayers } from '@/hooks/usePlayers'
import { usePersonalRounds } from '@/hooks/usePersonalRounds'
import {
  useFavouriteCourses,
  useUpsertFavouriteCourse,
  useDeleteFavouriteCourse,
  useUploadCoursePhoto,
} from '@/hooks/useFavouriteCourses'
import { usePlayerTrophies } from '@/hooks/useTrophies'
import { useScoresWithTournaments } from '@/hooks/useScores'
import { useSeasons } from '@/hooks/useSeasons'
import { useAuth } from '@/context/AuthContext'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { StarRating } from '@/components/ui/StarRating'
import { Card } from '@/components/ui/Card'
import type { Bag, BagItem, FavouriteCourse } from '@/types/db'
import type { TrophyRarity } from '@/lib/trophies'

// ─── Bag ──────────────────────────────────────────────────────────────────────
const CLUB_TYPES = [
  'Driver',
  'Fairway Wood',
  'Hybrid',
  'Iron',
  'Wedge',
  'Putter',
  'Ball',
  'Other',
]

// Old shape was an object; coerce to array for safety.
function toBagArray(bag: unknown): BagItem[] {
  if (Array.isArray(bag)) return bag as BagItem[]
  return []
}

function BagSection({ bag, editable, onSave }: {
  bag: Bag | unknown
  editable: boolean
  onSave?: (bag: Bag) => Promise<void>
}) {
  const [draft, setDraft] = useState<BagItem[]>(toBagArray(bag))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const items = editable ? draft : toBagArray(bag)

  function updateItem(i: number, patch: Partial<BagItem>) {
    setDraft((d) => d.map((item, idx) => (idx === i ? { ...item, ...patch } : item)))
  }
  function addItem() {
    setDraft((d) => [...d, { type: 'Driver', description: '' }])
  }
  function removeItem(i: number) {
    setDraft((d) => d.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!onSave) return
    setSaving(true)
    // Strip empty entries
    const clean = draft.filter((x) => x.description.trim())
    await onSave(clean)
    setDraft(clean)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!editable && items.length === 0) {
    return (
      <p className="font-serif italic text-green-mid text-sm text-center py-8">
        No bag details yet.
      </p>
    )
  }

  if (!editable) {
    return (
      <Card className="divide-y divide-green-pale">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="font-sans text-[10px] tracking-widest uppercase text-green-mid/70 w-24 flex-shrink-0">
              {item.type}
            </span>
            <span className="font-serif text-sm text-green-dark flex-1">
              {item.description}
            </span>
          </div>
        ))}
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {draft.length === 0 && (
        <p className="font-serif italic text-green-mid/60 text-sm text-center py-4">
          No clubs added yet.
        </p>
      )}
      {draft.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            className="field-select text-xs py-1.5 px-2 w-28 flex-shrink-0"
            value={item.type}
            onChange={(e) => updateItem(i, { type: e.target.value })}
          >
            {CLUB_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className="field-input flex-1 text-sm"
            placeholder="Brand / model"
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
          />
          <button
            onClick={() => removeItem(i)}
            className="text-red-600/70 hover:text-red-700 font-sans text-sm px-2 flex-shrink-0"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}

      <button onClick={addItem} className="btn-ghost w-full text-xs">
        + Add club
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save bag'}
      </button>
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

  // Read-only tile (empty or filled)
  if (!editable) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-green-faint shadow-card border border-green-pale">
          {course?.photo_url ? (
            <img src={course.photo_url} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif text-3xl text-green-mid/20">⛳</span>
            </div>
          )}
        </div>
        {course ? (
          <div className="px-0.5">
            <p className="font-serif text-xs text-green-dark leading-tight line-clamp-2">{course.name}</p>
            {course.notes && (
              <p className="font-sans text-[10px] text-green-mid/70 italic line-clamp-1">{course.notes}</p>
            )}
          </div>
        ) : (
          <p className="font-sans text-[10px] text-green-mid/40 italic text-center">Empty</p>
        )}
      </div>
    )
  }

  // Editable tile
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-green-faint shadow-card border border-green-pale group">
        {course?.photo_url ? (
          <img src={course.photo_url} alt={course.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-3xl text-green-mid/20">⛳</span>
          </div>
        )}

        {/* Photo upload overlay (only if course exists) */}
        {course && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-colors"
          >
            <span className="font-sans text-[10px] text-cream opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded">
              {uploadPhoto.isPending ? 'Uploading…' : course.photo_url ? 'Change' : 'Add photo'}
            </span>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      </div>

      {course && !editing ? (
        <div className="px-0.5">
          <p className="font-serif text-xs text-green-dark leading-tight line-clamp-2">{course.name}</p>
          {course.notes && (
            <p className="font-sans text-[10px] text-green-mid/70 italic line-clamp-1">{course.notes}</p>
          )}
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => { setName(course.name); setNotes(course.notes ?? ''); setEditing(true) }}
              className="font-sans text-[10px] text-green-mid hover:text-green-dark underline"
            >
              Edit
            </button>
            <span className="text-green-pale">·</span>
            <button
              onClick={handleRemove}
              disabled={remove.isPending}
              className="font-sans text-[10px] text-red-600/80 hover:text-red-700 underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <input
            className="field-input text-[11px] py-1 px-2"
            placeholder="Course"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field-input text-[11px] py-1 px-2"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={!name.trim() || upsert.isPending}
              className="btn-primary text-[10px] py-1 px-2 flex-1"
            >
              {upsert.isPending ? '…' : 'Save'}
            </button>
            {editing && (
              <button onClick={() => setEditing(false)} className="btn-ghost text-[10px] py-1 px-2">
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TopFourSection({ playerId, editable }: { playerId: string; editable: boolean }) {
  const { data: courses } = useFavouriteCourses(playerId)
  return (
    <div>
      <p className="font-sans text-[10px] tracking-widest uppercase text-green-mid/60 mb-2 text-center">
        Four Favourite Courses
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((slot) => (
          <CourseSlot
            key={slot}
            rank={slot}
            course={courses?.find((c) => c.rank === slot)}
            playerId={playerId}
            editable={editable}
          />
        ))}
      </div>
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
                {r.score != null && r.par != null && r.score < r.par + 20 && (
                  <span className="ml-1 text-gold font-medium">bonus ★</span>
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

// ─── Trophy Room ─────────────────────────────────────────────────────────────

const RARITY_STYLES: Record<
  TrophyRarity,
  { border: string; badge: string; label: string; glow: string }
> = {
  common:    { border: 'border-gray-200',      badge: 'bg-gray-100 text-gray-500',              label: 'Common',    glow: '' },
  uncommon:  { border: 'border-green-light/40', badge: 'bg-green-faint text-green-mid',          label: 'Uncommon',  glow: '' },
  rare:      { border: 'border-gold/60',        badge: 'bg-gold-faint text-[#8a6d0e]',           label: 'Rare',      glow: 'shadow-[0_0_12px_rgba(212,165,32,0.3)]' },
  epic:      { border: 'border-purple-300',     badge: 'bg-purple-50 text-purple-700',           label: 'Epic',      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' },
  legendary: { border: 'border-coral/60',       badge: 'bg-coral/10 text-coral-dark font-bold',  label: 'Legendary', glow: 'shadow-[0_0_18px_rgba(255,107,91,0.4)]' },
}

function TrophySection({ playerId }: { playerId: string }) {
  const { trophies, isLoading } = usePlayerTrophies(playerId)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-28 bg-green-pale/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  const unlocked = trophies.filter((t) => t.unlocked).length

  return (
    <div>
      <p className="font-sans text-xs text-green-mid text-center mb-3">
        <span className="font-semibold text-green-dark">{unlocked}</span>
        {' / '}
        {trophies.length} unlocked
      </p>

      <div className="grid grid-cols-3 gap-2">
        {trophies.map((t) => {
          const style = RARITY_STYLES[t.rarity]
          const isOpen = expanded === t.id
          return (
            <button
              key={t.id}
              onClick={() => setExpanded(isOpen ? null : t.id)}
              className={[
                'relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-left',
                t.unlocked
                  ? `bg-white ${style.border} ${style.glow}`
                  : 'bg-gray-50/60 border-gray-100 grayscale opacity-40',
              ].join(' ')}
            >
              <span className="text-4xl leading-none" role="img" aria-label={t.name}>
                {t.icon}
              </span>
              <p
                className={[
                  'font-sans text-[9px] font-semibold tracking-wide uppercase text-center leading-tight',
                  t.unlocked ? 'text-green-dark' : 'text-gray-400',
                ].join(' ')}
              >
                {t.name}
              </p>
              {t.unlocked && (
                <span
                  className={[
                    'font-sans text-[8px] px-1.5 py-0.5 rounded-full tracking-wide',
                    style.badge,
                  ].join(' ')}
                >
                  {style.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Description popover */}
      {expanded && (() => {
        const t = trophies.find((x) => x.id === expanded)
        if (!t) return null
        const style = RARITY_STYLES[t.rarity]
        return (
          <div
            className={[
              'mt-3 flex items-start gap-3 p-4 rounded-2xl border-2',
              t.unlocked ? `bg-white ${style.border}` : 'bg-gray-50 border-gray-200',
            ].join(' ')}
          >
            <span className="text-3xl leading-none flex-shrink-0">{t.icon}</span>
            <div>
              <p className="font-sans text-sm font-semibold text-green-dark">{t.name}</p>
              <p className="font-sans text-xs text-green-mid mt-0.5">{t.description}</p>
              {!t.unlocked && (
                <p className="font-sans text-[10px] text-gray-400 mt-1 italic">Locked</p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Compare panel ────────────────────────────────────────────────────────────

function ComparePanel({ profilePlayerId, myPlayerId }: { profilePlayerId: string; myPlayerId: string }) {
  const { data: theirScores } = useScoresWithTournaments(profilePlayerId)
  const { data: myScores }    = useScoresWithTournaments(myPlayerId)
  const { data: seasons }     = useSeasons()
  const { data: players }     = usePlayers()

  if (!theirScores || !myScores || !seasons || !players) {
    return <div className="h-48 bg-green-pale/40 rounded-2xl animate-pulse mb-4" />
  }

  const me   = players.find(p => p.id === myPlayerId)
  const them = players.find(p => p.id === profilePlayerId)

  // Round-level stats (all rounds)
  function roundStats(scores: typeof myScores) {
    const all = scores.map(s => s.gross_score)
    if (!all.length) return { best: null, worst: null, avg: null }
    return {
      best:  Math.min(...all),
      worst: Math.max(...all),
      avg:   Math.round(all.reduce((a, b) => a + b, 0) / all.length * 10) / 10,
    }
  }

  // Tournament-level stats (round 1 only has position)
  function tourneyStats(scores: typeof myScores) {
    const t1 = scores.filter(s => s.round_number === 1 && s.position != null)
    return {
      wins:   t1.filter(s => s.position === 1).length,
      played: t1.length,
      lastWin: t1
        .filter(s => s.position === 1)
        .sort((a, b) => (b.tournaments.date ?? '').localeCompare(a.tournaments.date ?? ''))[0]
        ?.tournaments.name ?? null,
    }
  }

  // Green jackets
  const greenJackets = (pid: string) => seasons.filter(s => s.champion_player_id === pid).length

  // Head-to-head: shared tournaments where both have position
  const myTourneyMap    = new Map(myScores.filter(s => s.round_number === 1 && s.position != null).map(s => [s.tournament_id, s.position!]))
  const theirTourneyMap = new Map(theirScores.filter(s => s.round_number === 1 && s.position != null).map(s => [s.tournament_id, s.position!]))
  let myWins = 0, theirWins = 0
  for (const [tid, myPos] of myTourneyMap) {
    const theirPos = theirTourneyMap.get(tid)
    if (theirPos == null) continue
    if (myPos < theirPos) myWins++
    else if (theirPos < myPos) theirWins++
  }
  const shared = myWins + theirWins

  const myStats    = roundStats(myScores)
  const theirStats = roundStats(theirScores)
  const myT        = tourneyStats(myScores)
  const theirT     = tourneyStats(theirScores)
  const myJackets  = greenJackets(myPlayerId)
  const theirJackets = greenJackets(profilePlayerId)

  // Helper: which side wins a stat (lower = better for scores, higher = better for wins/bucks/jackets)
  function winner(myVal: number | null, theirVal: number | null, lowerBetter = false): 'me' | 'them' | 'tie' {
    if (myVal == null || theirVal == null) return 'tie'
    if (myVal === theirVal) return 'tie'
    return lowerBetter
      ? (myVal < theirVal ? 'me' : 'them')
      : (myVal > theirVal ? 'me' : 'them')
  }

  function StatRow({ label, myVal, theirVal, lowerBetter = false }: {
    label: string
    myVal: string | number | null
    theirVal: string | number | null
    lowerBetter?: boolean
  }) {
    const w = winner(
      typeof myVal === 'number' ? myVal : null,
      typeof theirVal === 'number' ? theirVal : null,
      lowerBetter
    )
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 py-2 border-b border-green-pale last:border-0">
        <div className={`font-sans text-sm font-semibold text-right ${w === 'me' ? 'text-gold' : 'text-green-dark'}`}>
          {myVal ?? '—'}
          {w === 'me' && <span className="ml-1 text-gold text-xs">●</span>}
        </div>
        <div className="font-sans text-[9px] uppercase tracking-widest text-green-mid/60 text-center px-2 whitespace-nowrap">
          {label}
        </div>
        <div className={`font-sans text-sm font-semibold text-left ${w === 'them' ? 'text-gold' : 'text-green-dark'}`}>
          {w === 'them' && <span className="mr-1 text-gold text-xs">●</span>}
          {theirVal ?? '—'}
        </div>
      </div>
    )
  }

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_1fr] bg-green-dark px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-sans text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: me?.color }}>
            {me?.initials}
          </div>
          <span className="font-serif text-sm text-cream truncate">{me?.name}</span>
        </div>
        <span className="font-sans text-[10px] text-cream/40 uppercase tracking-widest self-center px-2">vs</span>
        <div className="flex items-center gap-2 justify-end">
          <span className="font-serif text-sm text-cream truncate">{them?.name}</span>
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-sans text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: them?.color }}>
            {them?.initials}
          </div>
        </div>
      </div>

      {/* Head-to-head banner */}
      {shared > 0 && (
        <div className="bg-green-dark/5 border-b border-green-pale px-4 py-2 flex items-center justify-center gap-3">
          <span className={`font-display text-2xl font-bold ${myWins >= theirWins ? 'text-gold' : 'text-green-dark'}`}>{myWins}</span>
          <span className="font-sans text-[10px] text-green-mid/60 uppercase tracking-widest">Head to head</span>
          <span className={`font-display text-2xl font-bold ${theirWins >= myWins ? 'text-gold' : 'text-green-dark'}`}>{theirWins}</span>
        </div>
      )}

      {/* Stat rows */}
      <div className="px-4">
        <StatRow label="Best round"    myVal={myStats.best}    theirVal={theirStats.best}    lowerBetter />
        <StatRow label="Avg score"     myVal={myStats.avg}     theirVal={theirStats.avg}     lowerBetter />
        <StatRow label="Worst round"   myVal={myStats.worst}   theirVal={theirStats.worst}   lowerBetter />
        <StatRow label="Wins"          myVal={myT.wins}        theirVal={theirT.wins} />
        <StatRow label="Green jackets" myVal={myJackets}       theirVal={theirJackets} />
        <StatRow label="Bagal Bucks"   myVal={me?.bagal_bucks ?? null} theirVal={them?.bagal_bucks ?? null} />
      </div>

      {/* Last wins */}
      {(myT.lastWin || theirT.lastWin) && (
        <div className="grid grid-cols-2 border-t border-green-pale">
          <div className="px-4 py-3 border-r border-green-pale">
            <p className="font-sans text-[9px] uppercase tracking-widest text-green-mid/60 mb-0.5">Last win</p>
            <p className="font-serif text-xs text-green-dark">{myT.lastWin ?? '—'}</p>
          </div>
          <div className="px-4 py-3">
            <p className="font-sans text-[9px] uppercase tracking-widest text-green-mid/60 mb-0.5">Last win</p>
            <p className="font-serif text-xs text-green-dark">{theirT.lastWin ?? '—'}</p>
          </div>
        </div>
      )}
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
          <p className="font-display text-2xl text-cream leading-tight font-semibold tracking-tight">{player.name}</p>
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
type ProfileTab = 'bag' | 'top4' | 'rounds' | 'trophies'

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
    { key: 'top4',     label: 'Top 4' },
    { key: 'rounds',   label: 'Rounds' },
    { key: 'bag',      label: 'The Bag' },
    { key: 'trophies', label: 'Trophies' },
  ]

  return (
    <>
      <div className="flex gap-1 bg-green-faint rounded-lg p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 font-sans text-[11px] py-1.5 rounded-md transition-all',
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
          onSave={editable ? async (bag) => { await updatePlayer.mutateAsync({ id: playerId, bag }) } : undefined}
        />
      )}
      {tab === 'trophies' && <TrophySection playerId={playerId} />}
    </>
  )
}

// ─── Public profile (read-only) ───────────────────────────────────────────────
export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>()
  const { data: player, isLoading } = usePlayer(playerId)
  const { profile } = useAuth()
  const [comparing, setComparing] = useState(false)

  const myPlayerId = profile?.player_id
  const canCompare = !!myPlayerId && !!playerId && myPlayerId !== playerId

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

      {canCompare && (
        <button
          onClick={() => setComparing(c => !c)}
          className={[
            'w-full mb-4 py-2 rounded-xl font-sans text-sm font-semibold border transition-colors',
            comparing
              ? 'bg-green-dark text-cream border-green-dark'
              : 'bg-white text-green-dark border-bone hover:border-green-mid',
          ].join(' ')}
        >
          {comparing ? 'Hide comparison' : 'Compare with me'}
        </button>
      )}

      {comparing && myPlayerId && (
        <ComparePanel profilePlayerId={player.id} myPlayerId={myPlayerId} />
      )}

      <ProfileTabs playerId={player.id} editable={false} />
    </div>
  )
}

// ─── Own profile (editable) ───────────────────────────────────────────────────
export { ProfileTabs, ProfileHeader, BagSection, TopFourSection, GreenBookSection }
