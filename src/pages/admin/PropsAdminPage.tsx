import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTournament } from '@/hooks/useTournaments'
import { usePlayers } from '@/hooks/usePlayers'
import { useScoresBySeason } from '@/hooks/useScores'
import { useTournaments } from '@/hooks/useTournaments'
import {
  usePropBets,
  useGenerateProps,
  useUpdatePropBet,
  useAddPropBet,
  useDeletePropBet,
  useVoidPropBet,
  useMarkPropResult,
} from '@/hooks/useProps'
import { Card } from '@/components/ui/Card'
import type { PropBet, PlayerBet } from '@/types/db'

const TYPE_OPTIONS = [
  { value: 'winner',           label: 'Winner' },
  { value: 'hole_in_one',      label: 'Hole in One' },
  { value: 'defend',           label: 'Defend Title' },
  { value: 'personal_best',    label: 'Personal Best' },
  { value: 'big_margin',       label: 'Big Margin (5+)' },
  { value: 'tie_game',         label: 'Tie Game' },
  { value: 'close_finish',     label: 'Close Finish (≤1)' },
  { value: 'duff_tee',         label: 'Duff the Tee Shot' },
  { value: 'water_ball',       label: 'Water Hazard' },
  { value: 'tilt',             label: 'Tilt / Rage' },
  { value: 'front_nine_choke', label: 'Front Nine Choke' },
  { value: 'birdie',           label: 'Birdie' },
  { value: 'multi_birdie',     label: 'Multiple Birdies' },
  { value: 'lost_balls',       label: 'Lost Balls (3+)' },
  { value: 'bunker_escape',    label: 'Bunker Nightmare' },
  { value: 'snowman',          label: 'Snowman (10+)' },
  { value: 'four_putt',        label: 'Four Putt' },
  { value: 'three_putt_18',    label: '3-Putt on 18' },
  { value: 'double_ob',        label: 'Double OB' },
  { value: 'blade_chip',       label: 'Blade a Chip' },
  { value: 'skull_ob',         label: 'Skull Bunker OB' },
  { value: 'custom',           label: 'Custom' },
]

const DEFAULT_ODDS: Record<string, string> = {
  winner:           '2.0',
  hole_in_one:      '12.0',
  defend:           '3.0',
  personal_best:    '3.0',
  big_margin:       '2.5',
  tie_game:         '4.0',
  close_finish:     '2.0',
  duff_tee:         '2.0',
  water_ball:       '1.5',
  tilt:             '2.5',
  front_nine_choke: '2.5',
  birdie:           '2.0',
  multi_birdie:     '5.0',
  lost_balls:       '2.0',
  bunker_escape:    '3.0',
  snowman:          '2.5',
  four_putt:        '3.0',
  three_putt_18:    '2.0',
  double_ob:        '2.5',
  blade_chip:       '2.5',
  skull_ob:         '6.0',
  custom:           '2.0',
}

// These types stay open after the auto-settlement run; admin marks them manually
const MANUAL_TYPES = new Set([
  'hole_in_one', 'tilt', 'water_ball', 'front_nine_choke',
  'duff_tee', 'birdie', 'multi_birdie', 'lost_balls', 'bunker_escape',
  'snowman', 'four_putt', 'three_putt_18', 'double_ob', 'blade_chip', 'skull_ob',
])

// ── Inline edit row ───────────────────────────────────────────────────────────

function PropBetRow({
  bet,
  seasonId,
}: {
  bet: PropBet & { player_bets?: Pick<PlayerBet, 'id' | 'player_id' | 'amount' | 'status'>[] }
  seasonId: string
}) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(bet.description)
  const [odds, setOdds] = useState(String(bet.odds))

  const updateBet = useUpdatePropBet()
  const deleteBet = useDeletePropBet()
  const voidBet = useVoidPropBet()
  const markResult = useMarkPropResult()

  const wagererCount = bet.player_bets?.filter((pb) => pb.status !== 'voided').length ?? 0
  const hasWagers = wagererCount > 0

  async function handleSave() {
    const oddsNum = parseFloat(odds)
    if (!desc.trim() || isNaN(oddsNum) || oddsNum < 1.1) return
    await updateBet.mutateAsync({ betId: bet.id, description: desc.trim(), odds: oddsNum })
    setEditing(false)
  }

  async function handleDelete() {
    if (hasWagers) {
      if (!confirm(`This bet has ${wagererCount} wager(s). Void it and refund all bets?`)) return
      await voidBet.mutateAsync(bet.id)
    } else {
      if (!confirm('Delete this bet?')) return
      await deleteBet.mutateAsync(bet.id)
    }
  }

  const statusBadge =
    bet.status === 'settled'
      ? bet.result
        ? <span className="font-sans text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Won</span>
        : <span className="font-sans text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Lost</span>
      : bet.status === 'voided'
        ? <span className="font-sans text-[10px] text-green-mid bg-green-pale/60 px-1.5 py-0.5 rounded">Voided</span>
        : null

  void seasonId

  return (
    <div className="py-3 border-b border-green-pale last:border-0">
      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="field-label">Description</label>
            <input
              className="field-input text-sm"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="field-label">Odds (multiplier)</label>
              <input
                type="number"
                step="0.05"
                min="1.1"
                className="field-input text-sm"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={updateBet.isPending}
              className="btn-primary text-sm py-1.5 px-3"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setDesc(bet.description); setOdds(String(bet.odds)) }}
              className="btn-ghost text-sm py-1.5 px-3"
            >
              Cancel
            </button>
          </div>
          {updateBet.isError && (
            <p className="font-sans text-xs text-red-600">{String(updateBet.error)}</p>
          )}
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-sans text-[10px] uppercase tracking-wide text-green-mid font-semibold">
                {bet.type}
              </span>
              {statusBadge}
              {wagererCount > 0 && (
                <span className="font-sans text-[10px] text-green-mid">
                  {wagererCount} wager{wagererCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="font-serif text-sm text-green-dark mt-0.5">{bet.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-sans text-base font-bold text-green-dark">{bet.odds}×</span>

            {bet.status === 'open' && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteBet.isPending || voidBet.isPending}
                  className="btn-danger text-xs py-1 px-2"
                >
                  {hasWagers ? 'Void' : 'Delete'}
                </button>
              </>
            )}

            {/* manual types stay open after settlement run — admin resolves these */}
            {MANUAL_TYPES.has(bet.type) && bet.status === 'open' && (
              <div className="flex gap-1">
                <button
                  onClick={() => markResult.mutateAsync({ betId: bet.id, won: true })}
                  disabled={markResult.isPending}
                  className="font-sans text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded px-2 py-1 transition-colors"
                >
                  Mark Won
                </button>
                <button
                  onClick={() => markResult.mutateAsync({ betId: bet.id, won: false })}
                  disabled={markResult.isPending}
                  className="font-sans text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded px-2 py-1 transition-colors"
                >
                  Mark Lost
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add custom bet form ───────────────────────────────────────────────────────

function AddBetForm({ tournamentId }: { tournamentId: string }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('custom')
  const [desc, setDesc] = useState('')
  const [oddsStr, setOddsStr] = useState('2.0')
  const [targetId, setTargetId] = useState('')
  const { data: players } = usePlayers()
  const addBet = useAddPropBet()

  async function handleAdd() {
    const odds = parseFloat(oddsStr)
    if (!desc.trim() || isNaN(odds) || odds < 1.1) return
    await addBet.mutateAsync({
      tournamentId,
      type,
      description: desc.trim(),
      targetPlayerId: targetId || null,
      odds,
    })
    setDesc('')
    setOddsStr('2.0')
    setTargetId('')
    setType('custom')
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm mt-2">
        + Add custom bet
      </button>
    )
  }

  return (
    <Card className="p-4 mt-3 space-y-3">
      <p className="font-serif text-sm text-green-dark">New bet</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Type</label>
          <select
            className="field-input text-sm"
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setOddsStr(DEFAULT_ODDS[e.target.value] ?? '2.0')
            }}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Odds (multiplier)</label>
          <input
            type="number"
            step="0.05"
            min="1.1"
            className="field-input text-sm"
            value={oddsStr}
            onChange={(e) => setOddsStr(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Description</label>
        <input
          className="field-input text-sm"
          placeholder="e.g. Will anyone 3-putt on the 18th?"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label">Target player (optional)</label>
        <select
          className="field-input text-sm"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        >
          <option value="">None</option>
          {players?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {addBet.isError && (
        <p className="font-sans text-xs text-red-600">{String(addBet.error)}</p>
      )}

      <div className="flex gap-2">
        <button onClick={handleAdd} disabled={addBet.isPending} className="btn-primary text-sm">
          Add bet
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost text-sm">
          Cancel
        </button>
      </div>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function PropsAdminPage() {
  const { seasonId, tournamentId } = useParams<{ seasonId: string; tournamentId: string }>()
  const { data: tournament } = useTournament(tournamentId)
  const { data: bets, isLoading } = usePropBets(tournamentId)
  const { data: allTournaments } = useTournaments(seasonId)
  const { data: allScores } = useScoresBySeason(seasonId)
  const { data: players } = usePlayers()

  const generateProps = useGenerateProps(
    seasonId,
    tournament && players && allTournaments && allScores ? tournament : undefined
  )

  const hasExistingOpen = bets?.some((b) => b.status === 'open') ?? false

  async function handleGenerate() {
    if (
      hasExistingOpen &&
      !confirm('This will replace all existing open props with freshly computed ones. Continue?')
    ) return
    await generateProps.mutateAsync()
  }

  return (
    <div>
      <div className="mb-1">
        <Link to="/admin/seasons" className="font-sans text-xs text-green-mid hover:underline">
          ← Back to seasons
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="font-serif text-xl text-green-dark">
          {tournament?.name ?? '…'} — Props
        </h2>
        <button
          onClick={handleGenerate}
          disabled={generateProps.isPending || !tournament || !players || !allTournaments || !allScores}
          className="btn-primary text-sm"
        >
          {generateProps.isPending
            ? 'Generating…'
            : hasExistingOpen
              ? 'Regenerate props'
              : 'Generate props'}
        </button>
      </div>

      {generateProps.isError && (
        <p className="font-sans text-xs text-red-600 mb-3">{String(generateProps.error)}</p>
      )}

      <div className="max-w-lg space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-green-pale/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !bets?.length ? (
          <Card className="p-4">
            <p className="font-sans text-sm text-green-mid">
              No props yet. Hit "Generate props" to auto-create bets from player history, or add custom bets below.
            </p>
          </Card>
        ) : (
          <>
            <Card className="px-4 py-0">
              {bets.map((bet) => (
                <PropBetRow key={bet.id} bet={bet} seasonId={seasonId!} />
              ))}
            </Card>

            <div className="font-sans text-xs text-green-mid px-1">
              {bets.filter((b) => b.status === 'open').length} open ·{' '}
              {bets.filter((b) => b.status === 'settled').length} settled ·{' '}
              {bets.filter((b) => b.status === 'voided').length} voided
            </div>
          </>
        )}

        {tournamentId && <AddBetForm tournamentId={tournamentId} />}
      </div>
    </div>
  )
}
