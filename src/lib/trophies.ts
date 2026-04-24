import type { Player, PersonalRound, Score, Season } from '@/types/db'

export type TrophyRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface TrophyContext {
  player: Player
  personalRounds: PersonalRound[]
  scores: Score[]
  seasons: Season[]
}

export interface Trophy {
  id: string
  name: string
  description: string
  // Emoji string or path to /public/trophies/<name>.png
  icon: string
  rarity: TrophyRarity
  check: (ctx: TrophyContext) => boolean
}

function distinctTournaments(scores: Score[]): string[] {
  return [...new Set(scores.map((s) => s.tournament_id))]
}

function tournamentsWithPosition(scores: Score[], position: number): string[] {
  const wins = new Set(
    scores.filter((s) => s.position === position).map((s) => s.tournament_id),
  )
  return [...wins]
}

export const TROPHY_CATALOG: Trophy[] = [
  // ─── Common ──────────────────────────────────────────────────────────────
  {
    id: 'first_tee',
    name: 'First Tee',
    description: 'Log your first personal round.',
    icon: '🏌️',
    rarity: 'common',
    check: ({ personalRounds }) => personalRounds.length >= 1,
  },
  {
    id: 'tournament_debut',
    name: 'Debut',
    description: 'Play in your first BAGAL tournament.',
    icon: '🎟️',
    rarity: 'common',
    check: ({ scores }) => scores.length >= 1,
  },
  {
    id: 'bonus_round',
    name: 'Under 20 Club',
    description: 'Shoot under 20-over par in a personal round.',
    icon: '⭐',
    rarity: 'common',
    check: ({ personalRounds }) =>
      personalRounds.some(
        (r) => r.score != null && r.par != null && r.score < r.par + 20,
      ),
  },

  // ─── Uncommon ────────────────────────────────────────────────────────────
  {
    id: 'green_book',
    name: 'Green Book',
    description: 'Log 5 or more personal rounds.',
    icon: '📒',
    rarity: 'uncommon',
    check: ({ personalRounds }) => personalRounds.length >= 5,
  },
  {
    id: 'podium',
    name: 'Podium Finish',
    description: 'Finish in the top 3 of any tournament.',
    icon: '🥉',
    rarity: 'uncommon',
    check: ({ scores }) =>
      scores.some((s) => s.position != null && s.position <= 3),
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Play in 3 or more BAGAL tournaments.',
    icon: '⛳',
    rarity: 'uncommon',
    check: ({ scores }) => distinctTournaments(scores).length >= 3,
  },
  {
    id: 'bucks_earner',
    name: 'Bucks Earner',
    description: 'Hold 300 or more BAGAL Bucks.',
    icon: '💰',
    rarity: 'uncommon',
    check: ({ player }) => player.bagal_bucks >= 300,
  },

  // ─── Rare ────────────────────────────────────────────────────────────────
  {
    id: 'grinder',
    name: 'The Grinder',
    description: 'Log 15 or more personal rounds.',
    icon: '💪',
    rarity: 'rare',
    check: ({ personalRounds }) => personalRounds.length >= 15,
  },
  {
    id: 'winner',
    name: 'Tournament Winner',
    description: 'Finish 1st in any tournament.',
    icon: '🏆',
    rarity: 'rare',
    check: ({ scores }) => tournamentsWithPosition(scores, 1).length >= 1,
  },
  {
    id: 'silver_fox',
    name: 'Silver Fox',
    description: 'Finish 2nd in 2 or more tournaments.',
    icon: '🥈',
    rarity: 'rare',
    check: ({ scores }) => tournamentsWithPosition(scores, 2).length >= 2,
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Hold 750 or more BAGAL Bucks.',
    icon: '💎',
    rarity: 'rare',
    check: ({ player }) => player.bagal_bucks >= 750,
  },

  // ─── Epic ────────────────────────────────────────────────────────────────
  {
    id: 'double_champ',
    name: 'Double Champion',
    description: 'Win 2 or more tournaments.',
    icon: '🎖️',
    rarity: 'epic',
    check: ({ scores }) => tournamentsWithPosition(scores, 1).length >= 2,
  },
  {
    id: 'scoring_machine',
    name: 'Scoring Machine',
    description: 'Log 25 or more personal rounds.',
    icon: '🔥',
    rarity: 'epic',
    check: ({ personalRounds }) => personalRounds.length >= 25,
  },

  // ─── Legendary ───────────────────────────────────────────────────────────
  {
    id: 'season_champ',
    name: 'Season Champion',
    description: 'Be crowned the BAGAL season champion.',
    icon: '👑',
    rarity: 'legendary',
    check: ({ player, seasons }) =>
      seasons.some((s) => s.champion_player_id === player.id),
  },
  {
    id: 'green_jacket',
    name: 'The Green Jacket',
    description:
      'Claim the season title having also won at least one tournament.',
    // Swap for /public/trophies/green_jacket.png once you have an image
    icon: '🟢',
    rarity: 'legendary',
    check: ({ player, scores, seasons }) => {
      const isSeasonChamp = seasons.some(
        (s) => s.champion_player_id === player.id,
      )
      const wonTournament = tournamentsWithPosition(scores, 1).length >= 1
      return isSeasonChamp && wonTournament
    },
  },
]
