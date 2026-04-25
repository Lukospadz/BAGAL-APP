import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { TournamentSheet } from '@/components/ui/TournamentSheet'
import { useSeasons } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'
import { useScoresBySeason } from '@/hooks/useScores'
import { usePlayers } from '@/hooks/usePlayers'
import type { Tournament, Score, Player, Season } from '@/types/db'

// ─── Season champion banner (completed seasons) ────────────────────────────────
function SeasonChampionBanner({
  season, champion, onClick,
}: {
  season: Season; champion: Player | null; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full relative overflow-hidden rounded-2xl shadow-pop border border-gold/20 p-6 mb-4 text-center hover:opacity-95 active:scale-[0.99] transition-all"
      style={{ background: '#1A3A2B' }}
    >
      {/* Ambient gold glow at base */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 110%, rgba(168,130,42,0.20) 0%, transparent 65%)' }}
      />

      <p className="relative font-sans text-[9px] font-bold tracking-[0.3em] uppercase text-gold/70 mb-4">
        Season Champion · {season.name}
      </p>

      {champion ? (
        <>
          <div className="relative flex justify-center mb-4">
            <div className="ring-2 ring-gold/50 rounded-full p-1.5 bg-gold/10">
              <PlayerAvatar
                name={champion.name}
                initials={champion.initials}
                color={champion.color}
                avatarUrl={champion.avatar_url}
                frame={champion.active_frame}
                size="lg"
              />
            </div>
          </div>
          <p className="relative font-display text-[30px] font-bold text-cream tracking-tight leading-none">
            {champion.name}
          </p>
          {champion.active_title && (
            <p className="relative font-sans text-xs text-gold/60 mt-1.5 italic">
              &ldquo;{champion.active_title}&rdquo;
            </p>
          )}
        </>
      ) : (
        <p className="relative font-serif italic text-cream/40">Champion not recorded</p>
      )}

      <p className="relative font-sans text-[10px] text-cream/25 mt-5 tracking-widest">
        TAP FOR SEASON DETAILS
      </p>
    </button>
  )
}

// ─── Season champion detail sheet ─────────────────────────────────────────────
function SeasonChampionSheet({
  season, champion, tournaments, scores, players, onClose,
}: {
  season: Season
  champion: Player | null
  tournaments: Tournament[]
  scores: Score[]
  players: Player[]
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const completed = tournaments.filter((t) => t.status === 'completed')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg sm:mx-4 bg-white rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
        {/* Dark green header */}
        <div className="bg-green-dark px-5 pt-4 pb-6">
          <div className="flex justify-center mb-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-cream/20" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-sans text-[9px] font-bold tracking-[0.25em] uppercase text-gold/60 mb-1">
                {season.name} · Season Champion
              </p>
              <p className="font-display text-2xl font-bold text-cream leading-tight">
                {champion?.name ?? '—'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-green-mid/30 flex items-center justify-center text-cream/60 hover:text-cream transition-colors flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
          {champion && (
            <div className="flex justify-center mt-4">
              <div className="ring-2 ring-gold/40 rounded-full p-1 bg-gold/10">
                <PlayerAvatar
                  name={champion.name}
                  initials={champion.initials}
                  color={champion.color}
                  avatarUrl={champion.avatar_url}
                  frame={champion.active_frame}
                  size="lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {completed.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-green-mid/70">
                  Tournament Results
                </span>
                <div className="flex-1 h-px bg-green-pale/60" />
              </div>
              {completed.map((t) => {
                const tScores = scores.filter((s) => s.tournament_id === t.id)
                const winnerScore = tScores.find((s) => s.position === 1)
                const winner = winnerScore ? players.find((p) => p.id === winnerScore.player_id) : null
                return (
                  <div key={t.id} className="rounded-xl border border-bone bg-white p-3.5">
                    <p className="font-serif text-sm font-semibold text-green-dark leading-tight">{t.name}</p>
                    {t.course && (
                      <p className="font-sans text-xs text-green-mid mt-0.5">{t.course}</p>
                    )}
                    {t.date && (
                      <p className="font-sans text-xs text-green-mid/60">{t.date}</p>
                    )}
                    {winner && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-bone">
                        <PlayerAvatar
                          name={winner.name}
                          initials={winner.initials}
                          color={winner.color}
                          avatarUrl={winner.avatar_url}
                          frame={winner.active_frame}
                          size="sm"
                        />
                        <span className="font-sans text-xs font-semibold text-gold">
                          {winner.name} won
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="font-display text-lg text-green-mid/60 mb-2">No Records</p>
              <p className="font-sans text-sm text-green-mid/50 italic">
                No tournament records were logged for this season.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Green jacket trophy (active seasons) ─────────────────────────────────────
function GreenJacket({ champion }: { champion: Player | null }) {
  return (
    <div className="relative flex flex-col items-center pt-12 pb-4">
      <div
        className="absolute pointer-events-none"
        style={{
          top: 30, width: 260, height: 260,
          background: 'radial-gradient(circle, rgba(168,130,42,0.60) 0%, rgba(168,130,42,0.30) 30%, rgba(168,130,42,0) 65%)',
          filter: 'blur(8px)',
          animation: 'aura-pulse 2.6s ease-in-out infinite',
        }}
      />
      <div style={{ animation: 'jacket-float 3.6s ease-in-out infinite' }} className="relative z-10">
        <svg viewBox="0 0 220 280" className="w-36 h-44 drop-shadow-xl">
          <defs>
            <linearGradient id="jacket-body2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d7a38" /><stop offset="40%" stopColor="#1e5128" /><stop offset="100%" stopColor="#0a2410" />
            </linearGradient>
            <linearGradient id="jacket-lapel2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#174018" /><stop offset="100%" stopColor="#071a0c" />
            </linearGradient>
            <linearGradient id="jacket-highlight2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" /><stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <ellipse cx="110" cy="268" rx="90" ry="6" fill="rgba(0,0,0,0.3)" />
          <path d="M 35 50 L 8 60 L 5 238 L 14 250 L 52 242 L 45 90 Z" fill="url(#jacket-body2)" />
          <path d="M 8 60 L 5 238" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M 10 232 L 50 226 L 52 242 L 14 250 Z" fill="rgba(0,0,0,0.22)" />
          <circle cx="24" cy="238" r="1.8" fill="#D4AE5C" stroke="#A8822A" strokeWidth="0.5" />
          <path d="M 185 50 L 212 60 L 215 238 L 206 250 L 168 242 L 175 90 Z" fill="url(#jacket-body2)" />
          <path d="M 212 60 L 215 238" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" />
          <path d="M 170 226 L 210 232 L 206 250 L 168 242 Z" fill="rgba(0,0,0,0.22)" />
          <circle cx="196" cy="238" r="1.8" fill="#D4AE5C" stroke="#A8822A" strokeWidth="0.5" />
          <path d="M 35 50 L 65 20 L 95 45 L 110 58 L 125 45 L 155 20 L 185 50 L 175 90 L 160 82 L 160 248 L 60 248 L 60 82 L 45 90 Z" fill="url(#jacket-body2)" />
          <path d="M 60 82 L 60 248 L 70 248 L 70 85 Z" fill="url(#jacket-highlight2)" />
          <path d="M 65 20 L 95 45 L 110 58 L 110 70 L 95 58 L 75 38 L 65 25 Z" fill="url(#jacket-lapel2)" />
          <path d="M 155 20 L 125 45 L 110 58 L 110 70 L 125 58 L 145 38 L 155 25 Z" fill="url(#jacket-lapel2)" />
          <path d="M 65 20 L 95 45" stroke="#4a9b5c" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 155 20 L 125 45" stroke="#4a9b5c" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 95 45 Q 110 55 125 45" stroke="#0a2410" strokeWidth="2" fill="none" />
          <circle cx="110" cy="115" r="3.5" fill="#D4AE5C" stroke="#A8822A" strokeWidth="0.8" />
          <circle cx="110" cy="155" r="3.5" fill="#D4AE5C" stroke="#A8822A" strokeWidth="0.8" />
          <circle cx="110" cy="195" r="3.5" fill="#D4AE5C" stroke="#A8822A" strokeWidth="0.8" />
          <rect x="128" y="100" width="22" height="27" fill="#0a2410" stroke="#A8822A" strokeWidth="0.6" rx="1" />
          <line x1="135" y1="106" x2="135" y2="122" stroke="#A8822A" strokeWidth="1" />
          <polygon points="135,106 145,109 135,112" fill="#A8822A" />
          <path d="M 35 50 L 45 90 L 60 82" fill="rgba(0,0,0,0.25)" />
          <path d="M 185 50 L 175 90 L 160 82" fill="rgba(0,0,0,0.25)" />
        </svg>
      </div>
      <p className="font-display text-2xl font-bold text-cream mt-4 tracking-tight drop-shadow">Green Jacket</p>
      {champion ? (
        <div className="flex items-center gap-2 mt-2 bg-white/90 px-3 py-1.5 rounded-full shadow-card border border-gold/50">
          <PlayerAvatar name={champion.name} initials={champion.initials} color={champion.color}
            avatarUrl={champion.avatar_url} frame={champion.active_frame} size="sm" />
          <span className="font-sans text-sm font-semibold text-green-dark">{champion.name}</span>
        </div>
      ) : (
        <p className="font-sans text-sm text-cream/70 italic mt-2">Up for grabs…</p>
      )}
    </div>
  )
}

// ─── Tournament tile ───────────────────────────────────────────────────────────
function TournamentTile({
  tournament, scores, players, align, onSelect,
}: {
  tournament: Tournament; scores: Score[]; players: Player[]
  align: 'left' | 'right'; onSelect: () => void
}) {
  const byPlayer = new Map<string, { position: number }>()
  for (const s of scores) {
    if (s.tournament_id !== tournament.id) continue
    if (!byPlayer.has(s.player_id)) byPlayer.set(s.player_id, { position: s.position ?? 99 })
  }
  const winner = [...byPlayer.entries()]
    .sort((a, b) => a[1].position - b[1].position)
    .map(([pid]) => players.find((p) => p.id === pid))[0] ?? null

  return (
    <div className={`w-[46%] relative ${align === 'left' ? 'ml-2 mr-auto' : 'ml-auto mr-2'}`}>
      <button
        onClick={onSelect}
        className="w-full bg-white/95 backdrop-blur rounded-2xl shadow-card border border-white/80 p-3 text-center hover:-translate-y-0.5 active:scale-95 transition-transform"
      >
        <p className="font-display text-sm font-semibold text-green-dark leading-tight tracking-tight">{tournament.name}</p>
        <div className="flex justify-center mt-2">
          {winner ? (
            <PlayerAvatar name={winner.name} initials={winner.initials} color={winner.color}
              avatarUrl={winner.avatar_url} frame={winner.active_frame} size="md" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-green-pale flex items-center justify-center">
              <span className="text-green-mid/40 text-lg">?</span>
            </div>
          )}
        </div>
        <p className="font-sans text-[10px] text-green-mid/70 mt-1.5">
          {tournament.status === 'completed' ? 'Champion' : 'Upcoming'}
        </p>
      </button>
    </div>
  )
}

function EmptySlot({ align, index }: { align: 'left' | 'right'; index: number }) {
  return (
    <div className={`w-[46%] ${align === 'left' ? 'ml-2 mr-auto' : 'ml-auto mr-2'}`}>
      <div className="w-full bg-white/40 backdrop-blur rounded-2xl border-2 border-dashed border-white/60 p-3 text-center">
        <p className="font-display text-sm font-semibold text-white/70 leading-tight">Stop {index + 1}</p>
        <div className="flex justify-center mt-2"><div className="w-10 h-10 rounded-full border-2 border-dashed border-white/50" /></div>
        <p className="font-sans text-[10px] text-white/60 mt-1.5 italic">TBD</p>
      </div>
    </div>
  )
}

// ─── Season course ─────────────────────────────────────────────────────────────
const TOTAL_SLOTS = 5

function SeasonCourse({ season, players }: { season: Season; players: Player[] }) {
  const { data: tournaments } = useTournaments(season.id)
  const { data: scores } = useScoresBySeason(season.id)
  const [selected, setSelected] = useState<Tournament | null>(null)
  const [showChampion, setShowChampion] = useState(false)

  const champion = players.find((p) => p.id === season.champion_player_id) ?? null
  const isCompleted = season.status === 'completed'
  const hasTournaments = (tournaments?.length ?? 0) > 0

  const slots: (Tournament | null)[] = Array.from(
    { length: Math.max(TOTAL_SLOTS, tournaments?.length ?? 0) },
    (_, i) => tournaments?.[i] ?? null,
  )

  return (
    <>
      {/* Completed season: champion banner + optional course */}
      {isCompleted && (
        <SeasonChampionBanner
          season={season}
          champion={champion}
          onClick={() => setShowChampion(true)}
        />
      )}

      {/* Course layout — active season always; completed only if it has tournaments */}
      {(!isCompleted || hasTournaments) && (
        <div
          className="relative rounded-3xl overflow-hidden py-6 px-2"
          style={{ background: isCompleted ? '#1A3A2B' : '#4a9b5c' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 1000">
            <path d={buildWindingPath(slots.length)} fill="none" stroke="#fbf8f1"
              strokeWidth="1.4" strokeDasharray="3 2.5" strokeLinecap="round" opacity="0.92" />
          </svg>
          <div className="relative space-y-8 py-4">
            {slots.map((t, i) =>
              t ? (
                <TournamentTile key={t.id} tournament={t} scores={scores ?? []} players={players}
                  align={i % 2 === 0 ? 'left' : 'right'} onSelect={() => setSelected(t)} />
              ) : (
                <EmptySlot key={`empty-${i}`} align={i % 2 === 0 ? 'left' : 'right'} index={i} />
              )
            )}
          </div>
          {!isCompleted && <GreenJacket champion={champion} />}
        </div>
      )}

      {/* Completed season with no data */}
      {isCompleted && !hasTournaments && (
        <div className="rounded-xl border border-bone bg-white/60 px-4 py-6 text-center">
          <p className="font-sans text-sm text-green-mid/60 italic">
            No tournament records were logged for this season.
          </p>
        </div>
      )}

      {selected && (
        <TournamentSheet tournament={selected} scores={scores ?? []} players={players}
          onClose={() => setSelected(null)} />
      )}

      {showChampion && (
        <SeasonChampionSheet
          season={season}
          champion={champion}
          tournaments={tournaments ?? []}
          scores={scores ?? []}
          players={players}
          onClose={() => setShowChampion(false)}
        />
      )}
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function TournamentsPage() {
  const { data: seasons, isLoading } = useSeasons()
  const { data: players } = usePlayers()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  const sortedSeasons = [...(seasons ?? [])].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (b.status === 'active' && a.status !== 'active') return 1
    return b.year - a.year
  })

  const activeSeason = sortedSeasons.find((s) => s.status === 'active')
  const currentSeason = seasons?.find(
    (s) => s.id === (selectedSeasonId ?? activeSeason?.id ?? sortedSeasons[0]?.id)
  ) ?? null

  return (
    <div className="p-4 pt-2">
      {sortedSeasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
          {sortedSeasons.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeasonId(s.id)}
              className={[
                'flex-shrink-0 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all',
                s.id === currentSeason?.id
                  ? 'bg-green-dark text-cream border-green-dark'
                  : 'bg-white text-green-mid border-bone hover:border-green-mid',
              ].join(' ')}
            >
              {s.name}
              {s.status === 'completed' && s.champion_player_id && (
                <span className="ml-1 text-gold">·</span>
              )}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-green-pale/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : !currentSeason ? (
        <EmptyState message="No seasons yet" hint="An admin will set up the first season." />
      ) : (
        <SeasonCourse season={currentSeason} players={players ?? []} />
      )}
    </div>
  )
}

function buildWindingPath(n: number): string {
  if (n < 1) return ''
  const pts: [number, number][] = [[50, 0]]
  const topPad = 60, bottomPad = 860
  const segSpan = n > 1 ? (bottomPad - topPad) / (n - 1) : 0
  for (let i = 0; i < n; i++) pts.push([i % 2 === 0 ? 25 : 75, topPad + i * segSpan])
  pts.push([50, 950])
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i], [px, py] = pts[i - 1]
    const dy = y - py
    d += ` C ${px} ${py + dy * 0.5}, ${x} ${y - dy * 0.5}, ${x} ${y}`
  }
  return d
}
