import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePlayer, useUpdatePlayer } from '@/hooks/usePlayers'
import { usePersonalRounds, useCreatePersonalRound, useDeletePersonalRound } from '@/hooks/usePersonalRounds'
import { usePlayerItems, useBuyShopItem, useEquipItem, useUnequipItem } from '@/hooks/useBucks'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { StarRating } from '@/components/ui/StarRating'
import { Card } from '@/components/ui/Card'
import { FRAME_ITEMS, TITLE_ITEMS, TIER_META, TIER_ORDER } from '@/lib/shop'
import type { ShopItem, ItemTier } from '@/lib/shop'

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'greenbook' | 'shop' | 'info'

// ─── Green Book ───────────────────────────────────────────────────────────────
function GreenBook({ playerId }: { playerId: string }) {
  const { data: rounds, isLoading } = usePersonalRounds(playerId)
  const createRound = useCreatePersonalRound()
  const deleteRound = useDeletePersonalRound()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [course, setCourse] = useState('')
  const [score, setScore] = useState('')
  const [par, setPar] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  async function handleAdd() {
    if (!course.trim()) return
    await createRound.mutateAsync({
      player_id: playerId,
      date,
      course: course.trim(),
      score: score ? parseInt(score) : null,
      par: par ? parseInt(par) : null,
      course_rating: rating || null,
      notes: notes.trim() || null,
    })
    setCourse('')
    setScore('')
    setPar('')
    setRating(0)
    setNotes('')
  }

  const scoreNum = score ? parseInt(score) : null
  const willEarnBucks = scoreNum !== null && scoreNum < 90

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="font-sans text-xs text-green-mid">
          Log a round you played outside of BAGAL. Break 90 and earn{' '}
          <span className="text-gold font-medium">+150 BAGAL Bucks</span>.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Date</label>
            <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Course</label>
            <input className="field-input" placeholder="Course name" value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Score</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input"
              placeholder="89"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Par</label>
            <input
              type="number"
              inputMode="numeric"
              className="field-input"
              placeholder="72"
              value={par}
              onChange={(e) => setPar(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label">Course rating</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="field-label">Notes (optional)</label>
          <input className="field-input" placeholder="Any notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {willEarnBucks && (
          <p className="font-sans text-xs text-gold font-medium">
            ⭐ Sub-90 round — you'll earn +150 BAGAL Bucks on save!
          </p>
        )}

        {createRound.isError && (
          <p className="font-sans text-xs text-red-600">{String(createRound.error)}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={!course.trim() || createRound.isPending}
          className="btn-primary w-full"
        >
          {createRound.isPending ? 'Saving…' : 'Log round'}
        </button>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 bg-green-pale/50 rounded-lg animate-pulse" />)}
        </div>
      ) : !rounds?.length ? (
        <p className="font-serif italic text-green-mid text-sm text-center py-4">No rounds logged yet.</p>
      ) : (
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
                          <span className={overUnder <= 0 ? 'text-green-mid' : 'text-green-mid'}>
                            {' '}({overUnder > 0 ? `+${overUnder}` : overUnder})
                          </span>
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
                  {r.notes && <p className="font-sans text-xs text-green-mid/60 mt-0.5">{r.notes}</p>}
                </div>
                <button
                  onClick={() => deleteRound.mutateAsync({ id: r.id, playerId })}
                  className="btn-danger text-xs py-1 px-2 flex-shrink-0"
                >
                  Delete
                </button>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
function ShopSection({ playerId, bucks }: { playerId: string; bucks: number }) {
  const [shopTab, setShopTab] = useState<'titles' | 'frames'>('titles')
  const { data: ownedItems } = usePlayerItems(playerId)
  const buyItem = useBuyShopItem()
  const equipItem = useEquipItem()
  const unequipItem = useUnequipItem()
  const { data: player } = usePlayer(playerId)

  const owned = new Set(ownedItems?.map((i) => i.item_id) ?? [])
  const items = shopTab === 'titles' ? TITLE_ITEMS : FRAME_ITEMS

  function isEquipped(item: ShopItem) {
    if (item.type === 'title') return player?.active_title === item.name
    return player?.active_frame === item.id
  }

  async function handleBuy(item: ShopItem) {
    if (!confirm(`Buy "${item.name}" for ${item.price} BAGAL Bucks?`)) return
    await buyItem.mutateAsync({ itemId: item.id, itemType: item.type, itemName: item.name, price: item.price })
  }

  async function handleEquip(item: ShopItem) {
    if (isEquipped(item)) {
      await unequipItem.mutateAsync(item.type)
    } else {
      await equipItem.mutateAsync(item.id)
    }
  }

  // Group items by tier for prettier display
  const grouped: Record<ItemTier, ShopItem[]> = { legendary: [], epic: [], rare: [], common: [] }
  for (const item of items) grouped[item.tier].push(item)

  return (
    <div className="space-y-4">
      {/* Balance banner */}
      <Card className="p-4 bg-gradient-to-br from-green-dark to-green-mid text-cream border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-cream/60">Your balance</p>
            <p className="font-serif text-2xl text-gold-light">
              {bucks.toLocaleString()} <span className="text-sm text-cream/70">BAGAL Bucks</span>
            </p>
          </div>
          <div className="flex gap-1 bg-black/20 rounded-lg p-1">
            {(['titles', 'frames'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setShopTab(t)}
                className={[
                  'font-sans text-xs px-3 py-1.5 rounded-md transition-all',
                  shopTab === t ? 'bg-cream text-green-dark font-medium' : 'text-cream/70 hover:text-cream',
                ].join(' ')}
              >
                {t === 'titles' ? 'Titles' : 'Frames'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {buyItem.isError && (
        <p className="font-sans text-xs text-red-600">{String(buyItem.error)}</p>
      )}

      {TIER_ORDER.map((tier) => {
        const tierItems = grouped[tier]
        if (!tierItems.length) return null
        const meta = TIER_META[tier]

        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-green-pale" />
              <span
                className={`font-sans text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${meta.badge}`}
              >
                {meta.label}
              </span>
              <div className="flex-1 h-px bg-green-pale" />
            </div>

            <div className="grid gap-2">
              {tierItems.map((item) => {
                const isOwned = owned.has(item.id)
                const equipped = isEquipped(item)
                const canAfford = bucks >= item.price
                return (
                  <Card
                    key={item.id}
                    className={[
                      'p-3 flex items-center gap-3 transition-all relative overflow-hidden',
                      equipped ? `ring-2 ${meta.ring}` : '',
                      isOwned && !equipped ? 'bg-green-faint/50' : '',
                    ].join(' ')}
                  >
                    {/* Left accent bar coloured by tier */}
                    <div
                      className={[
                        'absolute left-0 top-0 bottom-0 w-1',
                        tier === 'legendary' ? 'bg-amber-400' : '',
                        tier === 'epic'      ? 'bg-purple-400' : '',
                        tier === 'rare'      ? 'bg-sky-400'    : '',
                        tier === 'common'    ? 'bg-slate-300'  : '',
                      ].join(' ')}
                    />

                    {/* Icon: frame preview or title emblem */}
                    {item.type === 'frame' && item.frameKey ? (
                      <div
                        className={`w-10 h-10 rounded-full bg-green-dark flex-shrink-0 ml-2 avatar-frame-${item.frameKey}`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${meta.badge} border-2`}>
                        <span className="font-serif text-base">
                          {tier === 'legendary' ? '★' : tier === 'epic' ? '◆' : tier === 'rare' ? '●' : '○'}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`font-serif text-sm ${tier === 'legendary' ? 'text-amber-700 font-medium' : 'text-green-dark'}`}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="font-sans text-xs text-green-mid/80">{item.description}</p>
                      )}
                      {equipped && (
                        <p className={`font-sans text-[10px] font-bold tracking-widest uppercase ${meta.color}`}>
                          Equipped
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isOwned && (
                        <span className={`font-sans text-xs font-medium ${canAfford ? 'text-gold' : 'text-green-pale'}`}>
                          {item.price.toLocaleString()} BB
                        </span>
                      )}
                      {isOwned ? (
                        <button
                          onClick={() => handleEquip(item)}
                          disabled={equipItem.isPending || unequipItem.isPending}
                          className={equipped ? 'btn-ghost text-xs py-1 px-3' : 'btn-primary text-xs py-1 px-3'}
                        >
                          {equipped ? 'Unequip' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || buyItem.isPending}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Info / bio edit ──────────────────────────────────────────────────────────
function InfoSection({ playerId }: { playerId: string }) {
  const { data: player } = usePlayer(playerId)
  const updatePlayer = useUpdatePlayer()
  const [bio, setBio] = useState<string>('')
  const [homeCourse, setHomeCourse] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  if (player && !loaded) {
    setBio(player.bio ?? '')
    setHomeCourse(player.home_course ?? '')
    setLoaded(true)
  }

  async function handleSave() {
    await updatePlayer.mutateAsync({ id: playerId, bio: bio.trim() || null, home_course: homeCourse.trim() || null })
  }

  return (
    <Card className="p-4 space-y-3">
      <div>
        <label className="field-label">Bio</label>
        <textarea
          rows={3}
          className="field-input resize-none"
          placeholder="A few words about your game…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">Home course</label>
        <input
          className="field-input"
          placeholder="Heron Point Golf Links"
          value={homeCourse}
          onChange={(e) => setHomeCourse(e.target.value)}
        />
      </div>
      {updatePlayer.isError && (
        <p className="font-sans text-xs text-red-600">{String(updatePlayer.error)}</p>
      )}
      <button onClick={handleSave} disabled={updatePlayer.isPending} className="btn-primary w-full">
        {updatePlayer.isPending ? 'Saving…' : 'Save'}
      </button>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { profile, loading: authLoading } = useAuth()
  const playerId = profile?.player_id ?? undefined
  const { data: player, isLoading: playerLoading } = usePlayer(playerId)
  const [tab, setTab] = useState<Tab>('greenbook')

  if (authLoading) {
    return (
      <div className="p-4">
        <div className="h-28 bg-green-dark/10 rounded-xl animate-pulse mb-4" />
      </div>
    )
  }

  if (!playerId) {
    return (
      <div className="p-4">
        <Card className="p-6 text-center">
          <p className="font-serif text-base text-green-dark mb-2">Not linked to a player yet</p>
          <p className="font-sans text-sm text-green-mid">
            Your account needs to be linked to one of the BAGAL players by an admin.
          </p>
        </Card>
      </div>
    )
  }

  if (playerLoading || !player) {
    return (
      <div className="p-4">
        <div className="h-28 bg-green-dark/10 rounded-xl animate-pulse mb-4" />
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'greenbook', label: 'Green Book' },
    { key: 'shop',      label: 'Shop' },
    { key: 'info',      label: 'My Info' },
  ]

  return (
    <div className="p-4 pt-3">
      {/* Player header — dark gradient banner */}
      <div className="bg-gradient-to-br from-green-dark to-green-mid rounded-xl p-5 mb-4 flex items-center gap-4">
        <PlayerAvatar
          name={player.name}
          initials={player.initials}
          color={player.color}
          avatarUrl={player.avatar_url}
          frame={player.active_frame}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-xl text-cream leading-tight">{player.name}</p>
          {player.active_title && (
            <p className="font-sans text-xs text-gold-light font-medium mt-0.5">{player.active_title}</p>
          )}
          <p className="font-sans text-sm text-cream/60 mt-2">
            <span className="text-gold-light font-bold text-base">
              {player.bagal_bucks.toLocaleString()}
            </span>
            {' '}
            <span className="text-[11px] tracking-widest uppercase">BAGAL Bucks</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-green-dark/8 border border-green-pale rounded-xl p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-1 font-sans text-xs py-2 rounded-lg transition-all',
              tab === t.key
                ? 'bg-green-dark text-cream shadow-sm'
                : 'text-green-mid hover:text-green-dark hover:bg-green-faint',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'greenbook' && <GreenBook playerId={playerId} />}
      {tab === 'shop' && <ShopSection playerId={playerId} bucks={player.bagal_bucks} />}
      {tab === 'info' && <InfoSection playerId={playerId} />}
    </div>
  )
}
