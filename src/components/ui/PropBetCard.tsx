import { useState } from 'react'
import { usePlaceBet } from '@/hooks/useProps'
import type { PropBet, PlayerBet } from '@/types/db'

const TYPE_LABEL: Record<string, string> = {
  winner:           'Winner',
  hole_in_one:      'Longshot',
  defend:           'Defend',
  personal_best:    'Personal Best',
  big_margin:       'Big Margin',
  tie_game:         'Drama',
  close_finish:     'Drama',
  duff_tee:         'Disaster',
  water_ball:       'Hazard',
  tilt:             'Temper',
  front_nine_choke: 'Choke',
  birdie:           'Skill',
  multi_birdie:     'Skill',
  lost_balls:       'Disaster',
  bunker_escape:    'Disaster',
  snowman:          'Disaster',
  four_putt:        'Disaster',
  three_putt_18:    'Disaster',
  double_ob:        'Disaster',
  blade_chip:       'Disaster',
  skull_ob:         'Longshot',
  custom:           'Custom',
}

// Badge colors designed for the dark card background
const TYPE_COLOR: Record<string, string> = {
  winner:           'bg-gold/25 text-gold',
  hole_in_one:      'bg-coral/25 text-coral-light',
  defend:           'bg-purple-900/40 text-purple-300',
  personal_best:    'bg-sky/20 text-sky-light',
  big_margin:       'bg-cream/10 text-cream/60',
  tie_game:         'bg-cream/10 text-cream/60',
  close_finish:     'bg-cream/10 text-cream/60',
  duff_tee:         'bg-coral/25 text-coral-light',
  water_ball:       'bg-sky/20 text-sky-light',
  tilt:             'bg-coral/25 text-coral-light',
  front_nine_choke: 'bg-coral/25 text-coral-light',
  birdie:           'bg-green-mid/40 text-green-pale',
  multi_birdie:     'bg-green-mid/40 text-green-pale',
  lost_balls:       'bg-coral/25 text-coral-light',
  bunker_escape:    'bg-coral/25 text-coral-light',
  snowman:          'bg-coral/25 text-coral-light',
  four_putt:        'bg-coral/25 text-coral-light',
  three_putt_18:    'bg-coral/25 text-coral-light',
  double_ob:        'bg-coral/25 text-coral-light',
  blade_chip:       'bg-coral/25 text-coral-light',
  skull_ob:         'bg-coral/25 text-coral-light',
  custom:           'bg-cream/10 text-cream/60',
}

interface Props {
  bet: PropBet & {
    player_bets?: Pick<PlayerBet, 'id' | 'player_id' | 'amount' | 'potential_payout' | 'status'>[]
  }
  currentPlayerId?: string
  playerBalance?: number
  isLocked?: boolean
}

export function PropBetCard({ bet, currentPlayerId, playerBalance, isLocked }: Props) {
  const [amount, setAmount] = useState('')
  const placeBet = usePlaceBet()

  const myBet = currentPlayerId
    ? bet.player_bets?.find((pb) => pb.player_id === currentPlayerId)
    : undefined

  const isSelf = currentPlayerId != null && bet.target_player_id === currentPlayerId
  const canBet = !isLocked && !myBet && !isSelf && bet.status === 'open' && !!currentPlayerId

  const amountNum = parseInt(amount)
  const validAmount = !isNaN(amountNum) && amountNum >= 50 && amountNum <= (playerBalance ?? 0)
  const payout = validAmount ? Math.floor(amountNum * bet.odds) : null

  async function handlePlace() {
    if (!currentPlayerId || !validAmount) return
    try {
      await placeBet.mutateAsync({ propBetId: bet.id, playerId: currentPlayerId, amount: amountNum })
      setAmount('')
    } catch {
      // error surfaced via placeBet.error
    }
  }

  const wagererCount = bet.player_bets?.filter((pb) => pb.status !== 'voided').length ?? 0
  const isInactive = isLocked || bet.status !== 'open'

  return (
    <div className={`rounded-xl bg-green-dark border border-green-mid/20 p-4 space-y-3 transition-opacity ${isInactive && !myBet ? 'opacity-60' : ''}`}>

      {/* Header row: type + description + odds */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-block font-sans text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full mb-1.5 ${TYPE_COLOR[bet.type] ?? 'bg-cream/10 text-cream/60'}`}>
            {TYPE_LABEL[bet.type] ?? bet.type}
          </span>
          <p className="font-serif text-cream text-sm leading-snug">{bet.description}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          <span className="font-display text-2xl font-bold text-gold leading-none">{bet.odds}×</span>
          {wagererCount > 0 && (
            <p className="font-sans text-[10px] text-cream/35 mt-0.5">
              {wagererCount} bet{wagererCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {isLocked && bet.status === 'open' && (
        <p className="font-sans text-xs font-medium text-gold/80 bg-gold/10 border border-gold/20 rounded-lg px-3 py-1.5">
          Locked — tournament day. Good luck.
        </p>
      )}

      {/* Settled result */}
      {bet.status === 'settled' && (
        <p className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-lg ${
          bet.result
            ? 'bg-green-mid/30 text-green-pale'
            : 'bg-coral/20 text-coral-light'
        }`}>
          {bet.result ? 'Result: Won' : 'Result: Lost'}
        </p>
      )}

      {/* Voided */}
      {bet.status === 'voided' && (
        <p className="font-sans text-xs text-cream/40 bg-cream/5 border border-cream/10 rounded-lg px-3 py-1.5">
          Voided — bets refunded
        </p>
      )}

      {/* Player's existing bet */}
      {myBet && (
        <div className={`font-sans text-xs rounded-lg px-3 py-2 ${
          myBet.status === 'won'    ? 'bg-green-mid/30 text-green-pale' :
          myBet.status === 'lost'   ? 'bg-coral/20 text-coral-light'  :
          myBet.status === 'voided' ? 'bg-cream/5 text-cream/40'        :
          'bg-sky/15 text-sky-light'
        }`}>
          {myBet.status === 'pending' && (
            <>Your bet: <strong>{myBet.amount}</strong> BB · payout: <strong>{myBet.potential_payout}</strong> BB</>
          )}
          {myBet.status === 'won' && (
            <>Won — you bet {myBet.amount} BB and earned <strong>{myBet.potential_payout}</strong> BB</>
          )}
          {myBet.status === 'lost' && (
            <>Lost — you bet {myBet.amount} BB</>
          )}
          {myBet.status === 'voided' && (
            <>Refunded — {myBet.amount} BB returned</>
          )}
        </div>
      )}

      {/* Self-bet block */}
      {isSelf && bet.status === 'open' && !isLocked && (
        <p className="font-sans text-xs text-cream/40 italic">You can&apos;t bet on yourself</p>
      )}

      {/* Wager input */}
      {canBet && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="numeric"
                min={50}
                max={playerBalance}
                placeholder="50 min"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2 bg-green-mid/20 border border-green-mid/40 rounded-lg text-sm font-sans text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 focus:ring-0 pr-8 transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-xs text-cream/35 pointer-events-none">
                BB
              </span>
            </div>
            <button
              onClick={handlePlace}
              disabled={!validAmount || placeBet.isPending}
              className="bg-gold text-white font-sans text-sm font-bold px-4 py-2 rounded-lg hover:bg-gold-light disabled:opacity-40 transition-colors flex-shrink-0"
            >
              {placeBet.isPending ? '…' : 'Bet'}
            </button>
          </div>
          {payout != null && (
            <p className="font-sans text-xs text-cream/45">
              Payout if wins:{' '}
              <span className="font-semibold text-gold">{payout} BB</span>
            </p>
          )}
          {placeBet.isError && (
            <p className="font-sans text-xs text-coral-light">{String(placeBet.error)}</p>
          )}
        </div>
      )}

      {/* Not signed in nudge */}
      {!currentPlayerId && bet.status === 'open' && !isLocked && (
        <p className="font-sans text-xs text-cream/40 italic">Sign in to place a bet</p>
      )}
    </div>
  )
}
