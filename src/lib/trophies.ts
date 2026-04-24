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
  const hits = new Set(
    scores.filter((s) => s.position === position).map((s) => s.tournament_id),
  )
  return [...hits]
}

export const TROPHY_CATALOG: Trophy[] = [
  // ─── Common ──────────────────────────────────────────────────────────────
  {
    id: 'off_the_tee',
    name: 'Off The Tee',
    description: 'Log your first personal round.',
    icon: '🏌️',
    rarity: 'common',
    check: ({ personalRounds }) => personalRounds.length >= 1,
  },
  {
    id: 'showing_up',
    name: 'Showing Up',
    description: 'Play in your first BAGAL tournament. The bar was on the floor and you still had to stretch first.',
    icon: '🎟️',
    rarity: 'common',
    check: ({ scores }) => scores.length >= 1,
  },
  {
    id: 'the_whale',
    name: 'The Whale',
    description: 'Shoot 40 or more over par in a personal round. You were one with the water hazard. And the trees. And the car park.',
    icon: '🐳',
    rarity: 'common',
    check: ({ personalRounds }) =>
      personalRounds.some(
        (r) => r.score != null && r.par != null && r.score - r.par >= 40,
      ),
  },

  // ─── Uncommon ────────────────────────────────────────────────────────────
  {
    id: 'wrong_sport',
    name: 'Wrong Sport',
    description: 'Post a score of 100 or higher in a personal round. Bowlers would be impressed. Golfers are not.',
    icon: '🎳',
    rarity: 'uncommon',
    check: ({ personalRounds }) =>
      personalRounds.some((r) => r.score != null && r.score >= 100),
  },
  {
    id: 'wooden_spoon',
    name: 'Wooden Spoon',
    description: 'Finish last in any tournament. It\'s still a podium appearance. In the basement.',
    icon: '🥄',
    rarity: 'uncommon',
    check: ({ scores }) =>
      scores.some((s) => s.position != null && s.position >= 3),
  },
  {
    id: 'scenic_route',
    name: 'Scenic Route',
    description: 'Log rounds at 5 or more different courses. Not lost. Just very, very exploring.',
    icon: '🗺️',
    rarity: 'uncommon',
    check: ({ personalRounds }) =>
      new Set(personalRounds.map((r) => r.course).filter(Boolean)).size >= 5,
  },
  {
    id: 'under_20',
    name: 'Under 20 Club',
    description: 'Shoot under 20-over par in a personal round. A genuinely good day. Tell everyone. Repeatedly.',
    icon: '⭐',
    rarity: 'uncommon',
    check: ({ personalRounds }) =>
      personalRounds.some(
        (r) => r.score != null && r.par != null && r.score < r.par + 20,
      ),
  },

  // ─── Rare ────────────────────────────────────────────────────────────────
  {
    id: 'the_phantom',
    name: 'The Phantom',
    description: 'Earn 0 points in a tournament. Were you even there? The scorecard says technically yes.',
    icon: '👻',
    rarity: 'rare',
    check: ({ scores }) =>
      distinctTournaments(scores).some((tid) =>
        scores.filter((s) => s.tournament_id === tid).every((s) => s.points_awarded === 0),
      ),
  },
  {
    id: 'journalist',
    name: 'The Journalist',
    description: 'Add notes to 5 or more personal rounds. You need to process these feelings in writing.',
    icon: '📝',
    rarity: 'rare',
    check: ({ personalRounds }) =>
      personalRounds.filter((r) => r.notes && r.notes.trim().length > 0).length >= 5,
  },
  {
    id: 'par_tee_animal',
    name: 'Par-Tee Animal',
    description: 'Log 10 or more personal rounds. You keep coming back. We respect the commitment to suffering.',
    icon: '🎉',
    rarity: 'rare',
    check: ({ personalRounds }) => personalRounds.length >= 10,
  },
  {
    id: 'bridesmaid',
    name: 'Bridesmaid',
    description: 'Finish 2nd in 2 or more tournaments. Always the runner-up. Never the champ. The view is great from here.',
    icon: '💐',
    rarity: 'rare',
    check: ({ scores }) => tournamentsWithPosition(scores, 2).length >= 2,
  },
  {
    id: 'loaded',
    name: 'Loaded',
    description: 'Hold 500 or more BAGAL Bucks. Fake golf money is still money.',
    icon: '💰',
    rarity: 'rare',
    check: ({ player }) => player.bagal_bucks >= 500,
  },

  // ─── Epic ────────────────────────────────────────────────────────────────
  {
    id: 'on_a_heater',
    name: 'On A Heater',
    description: 'Win 2 or more tournaments. Okay okay, we get it, you\'re good.',
    icon: '🔥',
    rarity: 'epic',
    check: ({ scores }) => tournamentsWithPosition(scores, 1).length >= 2,
  },
  {
    id: 'ground_hog_day',
    name: 'Groundhog Day',
    description: 'Log 20 or more personal rounds. This is your entire personality now.',
    icon: '🔄',
    rarity: 'epic',
    check: ({ personalRounds }) => personalRounds.length >= 20,
  },

  // ─── Legendary ───────────────────────────────────────────────────────────
  {
    id: 'best_bad_golfer',
    name: 'Best Bad Golfer',
    description: 'Win the BAGAL season championship. You are the greatest below average golfer alive.',
    icon: '👑',
    rarity: 'legendary',
    check: ({ player, seasons }) =>
      seasons.some((s) => s.champion_player_id === player.id),
  },
  {
    id: 'green_jacket',
    name: 'The Green Jacket',
    description: 'Claim the season title having also won at least one tournament. The rarest achievement in the history of below average golf.',
    // Swap for /public/trophies/green_jacket.png once you have an image
    icon: '🟢',
    rarity: 'legendary',
    check: ({ player, scores, seasons }) => {
      const isSeasonChamp = seasons.some((s) => s.champion_player_id === player.id)
      const wonTournament = tournamentsWithPosition(scores, 1).length >= 1
      return isSeasonChamp && wonTournament
    },
  },
]
