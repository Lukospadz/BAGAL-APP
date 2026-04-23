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

// ─── Decorative: overhead golfer with long shadow ─────────────────────
function GolferOverhead({
  top,
  left,
  scale = 1,
  rotate = 0,
}: {
  top: string
  left: string
  scale?: number
  rotate?: number
}) {
  return (
    <svg
      viewBox="0 0 80 110"
      className="absolute pointer-events-none select-none"
      style={{
        top,
        left,
        width: `${48 * scale}px`,
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
      }}
      aria-hidden
    >
      {/* Long stretched shadow behind the figure */}
      <ellipse cx="56" cy="82" rx="26" ry="6" fill="#000" opacity="0.18" />
      <ellipse cx="56" cy="82" rx="18" ry="4" fill="#000" opacity="0.22" />

      {/* Body torso — simple ovals for stylized overhead view */}
      <ellipse cx="30" cy="55" rx="11" ry="16" fill="#fdfaf4" />
      {/* Arms (short stubs angled for walking) */}
      <ellipse cx="20" cy="52" rx="4" ry="8" fill="#fdfaf4" transform="rotate(-15 20 52)" />
      <ellipse cx="40" cy="58" rx="4" ry="8" fill="#fdfaf4" transform="rotate(12 40 58)" />
      {/* Head */}
      <circle cx="30" cy="38" r="8" fill="#fdfaf4" />
      {/* Cap peak */}
      <path d="M22 37 L38 37 L34 32 L26 32 Z" fill="#1e5128" opacity="0.85" />
      {/* Golf bag slung on back */}
      <rect x="34" y="45" width="6" height="22" rx="2" fill="#8a6d2c" />
      <rect x="35" y="45" width="4" height="4" rx="1" fill="#d4a520" />
    </svg>
  )
}

// ─── Green jacket trophy at the end ───────────────────────────────────
function GreenJacketTrophy({ champion }: { champion: Player | null }) {
  return (
    <div className="relative flex flex-col items-center py-12">
      {/* Pulsing glow halo */}
      <div
        className="absolute rounded-full -z-10"
        style={{
          width: 220,
          height: 220,
          top: 12,
          background:
            'radial-gradient(circle, rgba(245,217,112,0.45) 0%, rgba(245,217,112,0) 65%)',
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />

      {/* Green jacket SVG illustration */}
      <svg viewBox="0 0 160 180" className="w-32 h-36 drop-shadow-lg">
        {/* Shoulders/collar */}
        <path d="M25 40 L55 20 L80 35 L105 20 L135 40 L125 60 L105 55 L105 170 L55 170 L55 55 L35 60 Z" fill="#1e5128" />
        <path d="M55 35 L80 50 L105 35 L105 55 L80 65 L55 55 Z" fill="#1a4520" />
        {/* Buttons */}
        <circle cx="80" cy="85" r="2.5" fill="#d4a520" />
        <circle cx="80" cy="110" r="2.5" fill="#d4a520" />
        <circle cx="80" cy="135" r="2.5" fill="#d4a520" />
        {/* Augusta-style crest pocket */}
        <rect x="92" y="95" width="14" height="18" fill="#174018" stroke="#d4a520" strokeWidth="0.8" />
      </svg>

      <p className="font-display text-xl font-bold text-green-dark mt-3 tracking-tight">
        Green Jacket
      </p>
      {champion ? (
        <div className="flex items-center gap-2 mt-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-card border border-gold/40">
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
        <p className="font-sans text-xs text-green-mid/70 mt-2 italic">Up for grabs…</p>
      )}
    </div>
  )
}

// ─── Tournament card along the fairway ────────────────────────────────
function FairwayTournament({
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
  const byPlayer = new Map<string, { gross: number; position: number; points: number }>()
  for (const s of scores) {
    if (s.tournament_id !== tournament.id) continue
    const existing = byPlayer.get(s.player_id)
    if (existing) {
      existing.gross += s.gross_score
      existing.points += s.points_awarded
    } else {
      byPlayer.set(s.player_id, { gross: s.gross_score, position: s.position ?? 99, points: s.points_awarded })
    }
  }
  const sorted = [...byPlayer.entries()]
    .map(([playerId, d]) => ({ playerId, ...d }))
    .sort((a, b) => a.position - b.position)
  const completed = tournament.status === 'completed'

  return (
    <div className={`w-[78%] ${align === 'left' ? 'mr-auto ml-2' : 'ml-auto mr-2'}`}>
      <div className="relative">
        {/* Connector dot where path meets the card */}
        <div
          className={[
            'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white',
            completed ? 'bg-gold shadow-[0_0_12px_rgba(212,165,32,0.6)]' : 'bg-green-mid',
            align === 'left' ? '-right-4' : '-left-4',
          ].join(' ')}
        />

        <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-card border border-white/70 p-3.5 relative overflow-hidden">
          {/* Tiny flag icon in the corner */}
          <svg viewBox="0 0 24 24" className="absolute top-2 right-2 w-4 h-4 opacity-60">
            <line x1="6" y1="3" x2="6" y2="22" stroke="#0f2b14" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="6,3 20,7 6,11" fill={completed ? '#d4a520' : '#8bbf72'} />
          </svg>

          <p className="font-display text-[17px] font-semibold text-green-dark leading-tight tracking-tight pr-6">
            {tournament.name}
          </p>
          {tournament.course ? (
            <p className="font-sans text-xs text-green-mid mt-0.5">
              {tournament.course}
              {tournament.date ? ` · ${tournament.date}` : ''}
            </p>
          ) : (
            <p className="font-sans text-xs text-green-mid/70 mt-0.5 italic">
              {tournament.date ?? 'Not yet played'}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusPill status={tournament.status} />
            {tournament.course_rating != null && tournament.course_rating > 0 && (
              <StarRating value={tournament.course_rating} />
            )}
            <span className="font-sans text-[10px] text-green-mid/70 ml-auto">
              {tournament.points_1st}/{tournament.points_2nd}/{tournament.points_3rd} pts
            </span>
          </div>

          {completed && sorted.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-pale space-y-1.5">
              {sorted.map(({ playerId, gross, position, points }, i) => {
                const player = players.find((p) => p.id === playerId)
                if (!player) return null
                const isWinner = i === 0
                return (
                  <div key={playerId} className="flex items-center gap-2">
                    <span className={`font-sans text-[10px] w-5 text-right ${isWinner ? 'text-gold font-bold' : 'text-green-mid'}`}>
                      {POS_LABEL[i] ?? `${position}th`}
                    </span>
                    <PlayerAvatar
                      name={player.name}
                      initials={player.initials}
                      color={player.color}
                      avatarUrl={player.avatar_url}
                      frame={player.active_frame}
                      size="sm"
                    />
                    <span className={`font-sans text-sm flex-1 ${isWinner ? 'text-green-dark font-semibold' : 'text-green-mid'}`}>
                      {player.name}
                    </span>
                    <span className="font-sans text-xs text-green-mid">
                      {tournament.rounds > 1 ? `${gross}` : `${gross}`}
                    </span>
                    <span className="font-sans text-xs font-semibold text-green-mid w-12 text-right">
                      {points > 0 ? `+${points}` : '0'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────
export function TournamentsPage() {
  const { data: season } = useActiveSeason()
  const { data: tournaments, isLoading } = useTournaments(season?.id)
  const { data: scores } = useScoresBySeason(season?.id)
  const { data: players } = usePlayers()

  const champion = players?.find((p) => p.id === season?.champion_player_id) ?? null

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
      ) : !tournaments?.length ? (
        <EmptyState
          message="No tournaments scheduled yet"
          hint="An admin will add tournaments to this season."
        />
      ) : (
        <div
          className="relative rounded-3xl overflow-hidden py-8 px-3"
          style={{
            background:
              'linear-gradient(170deg, #8bbf72 0%, #6ab274 35%, #4a9b5c 75%, #2d7a38 100%)',
          }}
        >
          {/* Painterly fairway streaks */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-50 mix-blend-overlay"
            preserveAspectRatio="none"
            viewBox="0 0 400 1000"
          >
            <defs>
              <pattern id="grass-streaks" patternUnits="userSpaceOnUse" width="80" height="400" patternTransform="rotate(-8)">
                <path d="M10 0 Q 12 200 8 400" stroke="#fff" strokeWidth="0.4" fill="none" opacity="0.4" />
                <path d="M30 0 Q 34 200 28 400" stroke="#000" strokeWidth="0.3" fill="none" opacity="0.2" />
                <path d="M55 0 Q 60 200 50 400" stroke="#fff" strokeWidth="0.35" fill="none" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="400" height="1000" fill="url(#grass-streaks)" />
          </svg>

          {/* Winding dotted path (SVG, full-height) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 100 1000"
          >
            <path
              d={buildWindingPath(tournaments.length)}
              fill="none"
              stroke="#fdfaf4"
              strokeWidth="0.8"
              strokeDasharray="2 3"
              opacity="0.85"
              strokeLinecap="round"
            />
          </svg>

          {/* Decorative golfers */}
          <GolferOverhead top="8%" left="78%" scale={0.85} rotate={12} />
          <GolferOverhead top="34%" left="14%" scale={0.9} rotate={-18} />
          <GolferOverhead top="62%" left="72%" scale={0.8} rotate={24} />

          {/* Tournament cards alternating sides */}
          <div className="relative space-y-10 py-6">
            {tournaments.map((t, i) => (
              <FairwayTournament
                key={t.id}
                tournament={t}
                scores={scores ?? []}
                players={players ?? []}
                align={i % 2 === 0 ? 'left' : 'right'}
              />
            ))}
          </div>

          {/* Champion / Green Jacket at the end */}
          <GreenJacketTrophy champion={champion} />
        </div>
      )}
    </div>
  )
}

// Build a meandering SVG path that weaves through N checkpoints.
// Uses a 0-100 x coord space and 0-1000 y.
function buildWindingPath(n: number): string {
  if (n < 1) return ''
  const pts: Array<[number, number]> = []
  // Start near top centre
  pts.push([50, 0])
  // One checkpoint per tournament (alternate 25 / 75 to match card alignment)
  const topPad = 40
  const bottomPad = 880
  const segSpan = n > 1 ? (bottomPad - topPad) / (n - 1) : 0
  for (let i = 0; i < n; i++) {
    const x = i % 2 === 0 ? 25 : 75
    const y = topPad + i * segSpan
    pts.push([x, y])
  }
  // End at centre-bottom (where the green jacket sits)
  pts.push([50, 960])

  // Build cubic path with gentle curvature
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]
    const [px, py] = pts[i - 1]
    const dy = y - py
    // Control points halfway, nudged on x for curves
    const c1x = px
    const c1y = py + dy * 0.4
    const c2x = x
    const c2y = y - dy * 0.4
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`
  }
  return d
}
