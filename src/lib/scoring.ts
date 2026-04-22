import type { Player, Tournament, Score, CasualRound } from '@/types/db'

export interface PlayerStanding {
  player: Player
  tournamentPoints: number
  casualPoints: number
  totalPoints: number
  tournamentsPlayed: number
  wins: number
}

export interface TournamentResult {
  tournament: Tournament
  scores: (Score & { player: Player })[]
  positions: Map<string, number> // player_id -> position
}

/**
 * Compute standings for a season.
 * Standings are never stored — always computed from raw scores + casual rounds.
 */
export function computeStandings(
  players: Player[],
  tournaments: Tournament[],
  scores: Score[],
  casualRounds: CasualRound[]
): PlayerStanding[] {
  const standings = players.map((player) => {
    let tournamentPoints = 0
    let tournamentsPlayed = 0
    let wins = 0

    for (const tournament of tournaments) {
      if (tournament.status !== 'completed') continue

      const tournScores = scores.filter(
        (s) => s.tournament_id === tournament.id && s.player_id === player.id
      )
      if (!tournScores.length) continue

      tournamentsPlayed++

      // Sum across rounds (Masters has 4 rounds)
      const totalGross = tournScores.reduce((sum, s) => sum + s.gross_score, 0)

      // Find this player's score entry to get points_awarded
      // points_awarded is set by admin on entry
      const points = tournScores.reduce((sum, s) => sum + s.points_awarded, 0)
      tournamentPoints += points

      // Check for wins (position 1)
      const hasWin = tournScores.some((s) => s.position === 1)
      if (hasWin) wins++

      void totalGross // stored for future use
    }

    const casualPoints = casualRounds
      .filter((r) => r.winner_player_id === player.id)
      .reduce((sum, r) => sum + r.points_awarded, 0)

    return {
      player,
      tournamentPoints,
      casualPoints,
      totalPoints: tournamentPoints + casualPoints,
      tournamentsPlayed,
      wins,
    }
  })

  return standings.sort((a, b) => b.totalPoints - a.totalPoints)
}

/**
 * Given raw scores for a tournament, compute positions and points awarded.
 * Lowest total gross score wins. Ties are broken by the admin via explicit position.
 */
export function computeTournamentPositions(
  _players: Player[],
  scores: { playerId: string; roundScores: number[] }[],
  tournament: Tournament
): { playerId: string; totalGross: number; position: number; pointsAwarded: number }[] {
  const totals = scores.map(({ playerId, roundScores }) => ({
    playerId,
    totalGross: roundScores.reduce((a, b) => a + b, 0),
  }))

  // Sort by total gross ascending (lowest wins)
  totals.sort((a, b) => a.totalGross - b.totalGross)

  const pointsMap: Record<number, number> = {
    1: tournament.points_1st,
    2: tournament.points_2nd,
    3: tournament.points_3rd,
  }

  return totals.map((t, i) => ({
    playerId: t.playerId,
    totalGross: t.totalGross,
    position: i + 1,
    pointsAwarded: pointsMap[i + 1] ?? 0,
  }))
}

