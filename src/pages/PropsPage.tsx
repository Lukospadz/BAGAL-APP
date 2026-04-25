import { useAuth } from '@/context/AuthContext'
import { useSeasons } from '@/hooks/useSeasons'
import { useTournaments } from '@/hooks/useTournaments'
import { usePropBets, usePlayerBets } from '@/hooks/useProps'
import { usePlayers } from '@/hooks/usePlayers'
import { PropBetCard } from '@/components/ui/PropBetCard'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Tournament, PropBet } from '@/types/db'

const BET_GROUP_ORDER = [
  'winner', 'defend',
  'personal_best', 'big_margin', 'tie_game', 'close_finish',
  'birdie', 'multi_birdie',
  'hole_in_one', 'skull_ob',
  'duff_tee', 'water_ball', 'lost_balls', 'bunker_escape',
  'snowman', 'four_putt', 'three_putt_18', 'double_ob', 'blade_chip',
  'tilt', 'front_nine_choke',
]

const GROUP_LABEL: Record<string, string> = {
  winner:           'Main Bets',
  defend:           'Storylines',
  personal_best:    'Score Props',
  big_margin:       'Score Props',
  tie_game:         'Score Props',
  close_finish:     'Score Props',
  birdie:           'Skill Bets',
  multi_birdie:     'Skill Bets',
  hole_in_one:      'Longshots',
  skull_ob:         'Longshots',
  duff_tee:         'Disaster',
  water_ball:       'Disaster',
  lost_balls:       'Disaster',
  bunker_escape:    'Disaster',
  snowman:          'Disaster',
  four_putt:        'Disaster',
  three_putt_18:    'Disaster',
  double_ob:        'Disaster',
  blade_chip:       'Disaster',
  tilt:             'Chaos',
  front_nine_choke: 'Chaos',
}

function groupBets(bets: PropBet[]) {
  const groups = new Map<string, PropBet[]>()
  for (const b of bets) {
    const label = GROUP_LABEL[b.type] ?? 'Other'
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(b)
  }
  // Return in a sensible display order
  const ordered: { label: string; bets: PropBet[] }[] = []
  const seen = new Set<string>()
  for (const type of BET_GROUP_ORDER) {
    const label = GROUP_LABEL[type]
    if (label && !seen.has(label)) {
      const b = groups.get(label)
      if (b?.length) {
        ordered.push({ label, bets: b })
        seen.add(label)
      }
    }
  }
  for (const [label, b] of groups) {
    if (!seen.has(label)) ordered.push({ label, bets: b })
  }
  return ordered
}

function isLocked(tournament: Tournament): boolean {
  if (!tournament.date) return false
  return tournament.date <= new Date().toISOString().slice(0, 10)
}

// ── Tournament prop section ───────────────────────────────────────────────────

function TournamentPropSection({
  tournament,
  currentPlayerId,
  playerBalance,
}: {
  tournament: Tournament
  currentPlayerId?: string
  playerBalance?: number
}) {
  const { data: bets, isLoading } = usePropBets(tournament.id)
  const locked = isLocked(tournament)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-green-pale/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!bets?.length) {
    return (
      <p className="font-sans text-sm text-green-mid italic px-1">
        Props haven't been posted yet — check back soon.
      </p>
    )
  }

  const openBets = bets.filter((b) => b.status === 'open' || b.status === 'settled')
  const groups = groupBets(openBets)

  return (
    <div className="space-y-4">
      {locked && (
        <div className="font-sans text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Bets locked — this tournament is today. Good luck!
        </div>
      )}
      {groups.map(({ label, bets: groupBets }) => (
        <div key={label}>
          <div className="flex items-center gap-2 mb-2">
              <span className="font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-green-mid/70">{label}</span>
              <div className="flex-1 h-px bg-green-pale/60" />
            </div>
          <div className="space-y-2">
            {groupBets.map((bet) => (
              <PropBetCard
                key={bet.id}
                bet={bet}
                currentPlayerId={currentPlayerId}
                playerBalance={playerBalance}
                isLocked={locked}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Season block: upcoming tournaments ───────────────────────────────────────

function SeasonPropsBlock({
  seasonId,
  currentPlayerId,
  playerBalance,
}: {
  seasonId: string
  currentPlayerId?: string
  playerBalance?: number
}) {
  const { data: tournaments } = useTournaments(seasonId)
  const upcoming = tournaments?.filter((t) => t.status === 'upcoming') ?? []
  if (!upcoming.length) return null

  return (
    <>
      {upcoming.map((t) => (
        <div key={t.id} className="mb-6">
          <SectionLabel>{t.name}</SectionLabel>
          {t.date && (
            <p className="font-sans text-xs text-green-mid mb-3 px-1">
              {t.course ? `${t.course} · ` : ''}{t.date}
            </p>
          )}
          <TournamentPropSection
            tournament={t}
            currentPlayerId={currentPlayerId}
            playerBalance={playerBalance}
          />
        </div>
      ))}
    </>
  )
}

// ── Past results (settled bets) ───────────────────────────────────────────────

function PastResultsSection({
  currentPlayerId,
}: {
  currentPlayerId?: string
}) {
  const { data: myBets } = usePlayerBets(currentPlayerId)
  const settled = myBets?.filter((pb) => pb.status !== 'pending') ?? []
  if (!currentPlayerId || !settled.length) return null

  return (
    <div className="mb-6">
      <SectionLabel>Past results</SectionLabel>
      <div className="space-y-2">
        {settled.map((pb) => {
          const statusColor =
            pb.status === 'won' ? 'text-emerald-700' :
            pb.status === 'lost' ? 'text-red-500' :
            'text-green-mid'
          return (
            <Card key={pb.id} className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-serif text-sm text-green-dark truncate">
                  {pb.prop_bets.description}
                </p>
                <p className="font-sans text-xs text-green-mid">
                  {pb.prop_bets.tournaments.name}
                  {pb.prop_bets.tournaments.date ? ` · ${pb.prop_bets.tournaments.date}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-sans text-sm font-semibold ${statusColor}`}>
                  {pb.status === 'won' ? `+${pb.potential_payout} BB` :
                   pb.status === 'lost' ? `-${pb.amount} BB` :
                   'Voided'}
                </p>
                <p className="font-sans text-xs text-green-mid">
                  bet {pb.amount} BB · {pb.prop_bets.odds}×
                </p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── My Active Bets ────────────────────────────────────────────────────────────

function MyActiveBets({ currentPlayerId }: { currentPlayerId: string }) {
  const { data: myBets } = usePlayerBets(currentPlayerId)
  const pending = myBets?.filter((pb) => pb.status === 'pending') ?? []
  if (!pending.length) return null

  return (
    <div className="mb-6">
      <SectionLabel>Your active bets</SectionLabel>
      <div className="space-y-2">
        {pending.map((pb) => (
          <Card key={pb.id} className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-serif text-sm text-green-dark truncate">
                {pb.prop_bets.description}
              </p>
              <p className="font-sans text-xs text-green-mid">
                {pb.prop_bets.tournaments.name}
                {pb.prop_bets.tournaments.date ? ` · ${pb.prop_bets.tournaments.date}` : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-sans text-sm font-semibold text-sky-700">
                {pb.amount} BB wagered
              </p>
              <p className="font-sans text-xs text-green-mid">
                payout: {pb.potential_payout} BB · {pb.prop_bets.odds}×
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PropsPage() {
  const { profile } = useAuth()
  const { data: seasons, isLoading } = useSeasons()
  const { data: players } = usePlayers()

  const currentPlayer = profile?.player_id
    ? players?.find((p) => p.id === profile.player_id)
    : undefined

  const activeSeasons = seasons?.filter((s) => s.status === 'active') ?? []
  const hasActive = activeSeasons.length > 0

  return (
    <div className="p-4 pt-2">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-green-pale/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !hasActive ? (
        <EmptyState
          message="No active season"
          hint="Props will appear here when a season is underway and tournaments have been posted."
        />
      ) : (
        <>
          {currentPlayer && <MyActiveBets currentPlayerId={currentPlayer.id} />}

          {activeSeasons.map((s) => (
            <SeasonPropsBlock
              key={s.id}
              seasonId={s.id}
              currentPlayerId={currentPlayer?.id}
              playerBalance={currentPlayer?.bagal_bucks}
            />
          ))}

          {!hasActive && (
            <EmptyState
              message="No upcoming tournaments"
              hint="Props will appear here once upcoming tournaments are added."
            />
          )}

          {currentPlayer && <PastResultsSection currentPlayerId={currentPlayer.id} />}
        </>
      )}
    </div>
  )
}
