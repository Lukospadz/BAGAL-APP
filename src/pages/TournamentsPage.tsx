import { useState } from 'react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusPill } from '@/components/ui/StatusPill'
import { StarRating } from '@/components/ui/StarRating'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { useActiveSeason } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'
import { useScoresBySeason } from '@/hooks/useScores'
import { usePlayers } from '@/hooks/usePlayers'
import type { Tournament, Score, Player } from '@/types/db'

const POS_LABEL = ['1st', '2nd', '3rd']

// ─── Green jacket trophy at the end ───────────────────────────────────
function GreenJacket({ champion }: { champion: Player | null }) {
  return (
    <div className="relative flex flex-col items-center pt-12 pb-4">
      {/* Gold aura — pulsing radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 30,
          width: 260,
          height: 260,
          background:
            'radial-gradient(circle, rgba(245,217,112,0.75) 0%, rgba(212,165,32,0.45) 30%, rgba(245,217,112,0) 65%)',
          filter: 'blur(8px)',
          animation: 'aura-pulse 2.6s ease-in-out infinite',
        }}
      />

      {/* Jacket — bobs + rotates */}
      <div
        style={{ animation: 'jacket-float 3.6s ease-in-out infinite' }}
        className="relative z-10"
      >
        <svg viewBox="0 0 220 280" className="w-36 h-44 drop-shadow-xl">
          <defs>
            {/* Main jacket fabric — gradient gives 3D depth */}
            <linearGradient id="jacket-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d7a38" />
              <stop offset="40%" stopColor="#1e5128" />
              <stop offset="100%" stopColor="#0a2410" />
            </linearGradient>
            {/* Darker lapel */}
            <linearGradient id="jacket-lapel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#174018" />
              <stop offset="100%" stopColor="#071a0c" />
            </linearGradient>
            {/* Highlight */}
            <linearGradient id="jacket-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Drop shadow beneath */}
          <ellipse cx="110" cy="268" rx="90" ry="6" fill="rgba(0,0,0,0.3)" />

          {/* Left sleeve (drawn before body so body overlaps cleanly) */}
          <path
            d="M 35 50
               L 8 60
               L 5 238
               L 14 250
               L 52 242
               L 45 90 Z"
            fill="url(#jacket-body)"
          />
          {/* Left sleeve outer edge highlight */}
          <path d="M 8 60 L 5 238" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" />
          {/* Left cuff band */}
          <path
            d="M 10 232 L 50 226 L 52 242 L 14 250 Z"
            fill="rgba(0,0,0,0.22)"
          />
          {/* Left cuff button */}
          <circle cx="24" cy="238" r="1.8" fill="#f5d970" stroke="#d4a520" strokeWidth="0.5" />

          {/* Right sleeve */}
          <path
            d="M 185 50
               L 212 60
               L 215 238
               L 206 250
               L 168 242
               L 175 90 Z"
            fill="url(#jacket-body)"
          />
          {/* Right sleeve shadow edge (opposite side, darker) */}
          <path d="M 212 60 L 215 238" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" fill="none" />
          {/* Right cuff band */}
          <path
            d="M 170 226 L 210 232 L 206 250 L 168 242 Z"
            fill="rgba(0,0,0,0.22)"
          />
          {/* Right cuff button */}
          <circle cx="196" cy="238" r="1.8" fill="#f5d970" stroke="#d4a520" strokeWidth="0.5" />

          {/* Main body silhouette */}
          <path
            d="M 35 50
               L 65 20
               L 95 45
               L 110 58
               L 125 45
               L 155 20
               L 185 50
               L 175 90
               L 160 82
               L 160 248
               L 60 248
               L 60 82
               L 45 90 Z"
            fill="url(#jacket-body)"
          />

          {/* Top-body highlight strip (left edge) */}
          <path
            d="M 60 82 L 60 248 L 70 248 L 70 85 Z"
            fill="url(#jacket-highlight)"
          />

          {/* Left lapel */}
          <path
            d="M 65 20 L 95 45 L 110 58 L 110 70 L 95 58 L 75 38 L 65 25 Z"
            fill="url(#jacket-lapel)"
          />
          {/* Right lapel */}
          <path
            d="M 155 20 L 125 45 L 110 58 L 110 70 L 125 58 L 145 38 L 155 25 Z"
            fill="url(#jacket-lapel)"
          />

          {/* Lapel notch highlight */}
          <path d="M 65 20 L 95 45" stroke="#4a9b5c" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 155 20 L 125 45" stroke="#4a9b5c" strokeWidth="0.8" fill="none" opacity="0.7" />

          {/* Collar line behind */}
          <path
            d="M 95 45 Q 110 55 125 45"
            stroke="#0a2410"
            strokeWidth="2"
            fill="none"
          />

          {/* Gold buttons */}
          <circle cx="110" cy="115" r="3.5" fill="#f5d970" stroke="#d4a520" strokeWidth="0.8" />
          <circle cx="110" cy="155" r="3.5" fill="#f5d970" stroke="#d4a520" strokeWidth="0.8" />
          <circle cx="110" cy="195" r="3.5" fill="#f5d970" stroke="#d4a520" strokeWidth="0.8" />

          {/* Crest pocket on right breast */}
          <rect
            x="128"
            y="100"
            width="22"
            height="27"
            fill="#0a2410"
            stroke="#d4a520"
            strokeWidth="0.6"
            rx="1"
          />
          {/* Tiny flag inside the crest */}
          <line x1="135" y1="106" x2="135" y2="122" stroke="#d4a520" strokeWidth="1" />
          <polygon points="135,106 145,109 135,112" fill="#d4a520" />

          {/* Sleeve shadows (suggest 3D) */}
          <path d="M 35 50 L 45 90 L 60 82" fill="rgba(0,0,0,0.25)" />
          <path d="M 185 50 L 175 90 L 160 82" fill="rgba(0,0,0,0.25)" />
        </svg>
      </div>

      <p className="font-display text-2xl font-bold text-cream mt-4 tracking-tight drop-shadow">
        Green Jacket
      </p>
      {champion ? (
        <div className="flex items-center gap-2 mt-2 bg-white/90 px-3 py-1.5 rounded-full shadow-card border border-gold/50">
          <PlayerAvatar
            name={champion.name}
            initials={champion.initials}
            color={champion.color}
            avatarUrl={champion.avatar_url}
            frame={champion.active_frame}
            size="sm"
          />
          <span className="font-sans text-sm font-semibold text-green-dark">{champion.name}</span>
        </div>
      ) : (
        <p className="font-sans text-sm text-cream/80 italic mt-2">Up for grabs…</p>
      )}
    </div>
  )
}

// ─── Tournament tile along the path ───────────────────────────────────
function TournamentTile({
  tournament,
  scores,
  players,
  align,
}: {
  tournament: Tournament
  scores: Score[]
  players: Player[]
  align: 'left' | 'right'
}) {
  const [expanded, setExpanded] = useState(false)

  // Winner calc
  const byPlayer = new Map<string, { gross: number; position: number; points: number }>()
  for (const s of scores) {
    if (s.tournament_id !== tournament.id) continue
    const e = byPlayer.get(s.player_id)
    if (e) { e.gross += s.gross_score; e.points += s.points_awarded }
    else byPlayer.set(s.player_id, { gross: s.gross_score, position: s.position ?? 99, points: s.points_awarded })
  }
  const sorted = [...byPlayer.entries()]
    .map(([playerId, d]) => ({ playerId, ...d }))
    .sort((a, b) => a.position - b.position)

  const winner = sorted.length ? players.find((p) => p.id === sorted[0].playerId) : null
  const completed = tournament.status === 'completed'

  return (
    <div className={`w-[46%] relative ${align === 'left' ? 'ml-2 mr-auto' : 'ml-auto mr-2'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-white/95 backdrop-blur rounded-2xl shadow-card border border-white/80 p-3 text-center hover:-translate-y-0.5 transition-transform relative"
      >
        <p className="font-display text-sm font-semibold text-green-dark leading-tight tracking-tight">
          {tournament.name}
        </p>

        <div className="flex justify-center mt-2">
          {winner ? (
            <PlayerAvatar
              name={winner.name}
              initials={winner.initials}
              color={winner.color}
              avatarUrl={winner.avatar_url}
              frame={winner.active_frame}
              size="md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-green-pale flex items-center justify-center">
              <span className="text-green-mid/40 text-lg">?</span>
            </div>
          )}
        </div>

        <p className="font-sans text-[10px] text-green-mid/70 mt-1.5">
          {completed ? 'Champion' : 'Upcoming'}
        </p>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="mt-2 rounded-2xl bg-white/95 border border-white/80 shadow-card p-3 text-left">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusPill status={tournament.status} />
            {tournament.course_rating != null && tournament.course_rating > 0 && (
              <StarRating value={tournament.course_rating} />
            )}
          </div>
          {tournament.course && (
            <p className="font-sans text-xs text-green-mid">
              {tournament.course}
              {tournament.date ? ` · ${tournament.date}` : ''}
            </p>
          )}
          <p className="font-sans text-[11px] text-green-mid/70 mt-1">
            {tournament.points_1st}/{tournament.points_2nd}/{tournament.points_3rd} pts
            {tournament.rounds > 1 && ` · ${tournament.rounds} rounds`}
          </p>

          {completed && sorted.length > 0 && (
            <div className="mt-2 pt-2 border-t border-green-pale space-y-1">
              {sorted.map(({ playerId, gross, position, points }, i) => {
                const player = players.find((p) => p.id === playerId)
                if (!player) return null
                const isWinner = i === 0
                return (
                  <div key={playerId} className="flex items-center gap-1.5">
                    <span className={`font-sans text-[10px] w-4 ${isWinner ? 'text-gold font-bold' : 'text-green-mid'}`}>
                      {POS_LABEL[i] ?? `${position}`}
                    </span>
                    <PlayerAvatar
                      name={player.name}
                      initials={player.initials}
                      color={player.color}
                      avatarUrl={player.avatar_url}
                      size="sm"
                    />
                    <span className={`font-sans text-xs flex-1 truncate ${isWinner ? 'text-green-dark font-semibold' : 'text-green-mid'}`}>
                      {player.name}
                    </span>
                    <span className="font-sans text-[10px] text-green-mid">{gross}</span>
                    <span className="font-sans text-[10px] font-semibold text-green-mid w-6 text-right">
                      +{points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Empty placeholder slot (when fewer than 5 tournaments exist)
function EmptySlot({ align, index }: { align: 'left' | 'right'; index: number }) {
  return (
    <div className={`w-[46%] ${align === 'left' ? 'ml-2 mr-auto' : 'ml-auto mr-2'}`}>
      <div className="w-full bg-white/40 backdrop-blur rounded-2xl border-2 border-dashed border-white/60 p-3 text-center">
        <p className="font-display text-sm font-semibold text-white/70 leading-tight">
          Stop {index + 1}
        </p>
        <div className="flex justify-center mt-2">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/50" />
        </div>
        <p className="font-sans text-[10px] text-white/60 mt-1.5 italic">TBD</p>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────
const TOTAL_SLOTS = 5

export function TournamentsPage() {
  const { data: season } = useActiveSeason()
  const { data: tournaments, isLoading } = useTournaments(season?.id)
  const { data: scores } = useScoresBySeason(season?.id)
  const { data: players } = usePlayers()

  const champion = players?.find((p) => p.id === season?.champion_player_id) ?? null

  // Always show TOTAL_SLOTS stops; fill with real tournaments, rest are TBD
  const slots: (Tournament | null)[] = Array.from(
    { length: Math.max(TOTAL_SLOTS, tournaments?.length ?? 0) },
    (_, i) => tournaments?.[i] ?? null,
  )

  return (
    <div className="p-4 pt-2">
      <SectionLabel>
        {season ? `${season.name} course` : 'Season course'}
      </SectionLabel>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-green-pale/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !season ? (
        <EmptyState message="No active season" hint="An admin will set up the current season." />
      ) : (
        <div
          className="relative rounded-3xl overflow-hidden py-6 px-2"
          style={{ background: '#4a9b5c' }}
        >
          {/* Flat overhead winding path — THICK DASHED */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 1000"
          >
            <path
              d={buildWindingPath(slots.length)}
              fill="none"
              stroke="#fbf8f1"
              strokeWidth="1.4"
              strokeDasharray="3 2.5"
              strokeLinecap="round"
              opacity="0.92"
            />
          </svg>

          {/* Tournament stops alternating sides */}
          <div className="relative space-y-8 py-4">
            {slots.map((t, i) =>
              t ? (
                <TournamentTile
                  key={t.id}
                  tournament={t}
                  scores={scores ?? []}
                  players={players ?? []}
                  align={i % 2 === 0 ? 'left' : 'right'}
                />
              ) : (
                <EmptySlot key={`empty-${i}`} align={i % 2 === 0 ? 'left' : 'right'} index={i} />
              ),
            )}
          </div>

          {/* Green jacket at the end */}
          <GreenJacket champion={champion} />
        </div>
      )}
    </div>
  )
}

// Build a smooth cubic-bezier path that weaves left/right through N stops.
function buildWindingPath(n: number): string {
  if (n < 1) return ''
  const pts: [number, number][] = []
  pts.push([50, 0])
  const topPad = 60
  const bottomPad = 860
  const segSpan = n > 1 ? (bottomPad - topPad) / (n - 1) : 0
  for (let i = 0; i < n; i++) {
    // Cards are ~46% wide on alternating sides; path meets near their centre
    const x = i % 2 === 0 ? 25 : 75
    const y = topPad + i * segSpan
    pts.push([x, y])
  }
  pts.push([50, 950])

  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]
    const [px, py] = pts[i - 1]
    const dy = y - py
    const c1x = px
    const c1y = py + dy * 0.5
    const c2x = x
    const c2y = y - dy * 0.5
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`
  }
  return d
}
