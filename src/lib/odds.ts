import type { Player, Tournament, Score } from '@/types/db'

export interface PropBetDef {
  type: string
  description: string
  target_player_id: string | null
  odds: number
}

interface PlayerStats {
  player: Player
  tournamentsPlayed: number
  wins: number
  winRate: number
  avgRecentPosition: number | null
}

function buildStats(players: Player[], allScores: Score[], completedTournaments: Tournament[]): PlayerStats[] {
  return players.map((player) => {
    const playerScores = allScores.filter((s) => s.player_id === player.id)

    const tournamentsPlayed = completedTournaments.filter((t) =>
      playerScores.some((s) => s.tournament_id === t.id)
    ).length

    const wins = playerScores.filter((s) => s.position === 1).length
    const winRate = tournamentsPlayed > 0 ? wins / tournamentsPlayed : 0

    const recentPositions = completedTournaments
      .filter((t) => t.date != null)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 3)
      .flatMap((t) => {
        const s = playerScores.find((s) => s.tournament_id === t.id && s.position != null)
        return s ? [s.position!] : []
      })

    const avgRecentPosition =
      recentPositions.length > 0
        ? recentPositions.reduce((a, b) => a + b, 0) / recentPositions.length
        : null

    return { player, tournamentsPlayed, wins, winRate, avgRecentPosition }
  })
}

function roundOdds(raw: number): number {
  return Math.round(raw * 20) / 20
}

export function computeProps(
  tournament: Tournament,
  players: Player[],
  allScores: Score[],
  allTournaments: Tournament[]
): PropBetDef[] {
  const bets: PropBetDef[] = []
  const completed = allTournaments.filter((t) => t.status === 'completed')
  const stats = buildStats(players, allScores, completed)
  const n = players.length

  // ── Winner bets (per player, odds from history) ───────────────────────────

  if (n > 0) {
    const anyHistory = stats.some((s) => s.tournamentsPlayed > 0)

    const raw = stats.map((s) => {
      if (!anyHistory || s.tournamentsPlayed === 0) return { player: s.player, score: 1 / n }
      const winComp = s.winRate * 0.6
      const medianPos = (n + 1) / 2
      const pos = s.avgRecentPosition ?? medianPos
      const formComp = (1 / pos) * 0.4
      return { player: s.player, score: winComp + formComp }
    })

    const total = raw.reduce((sum, r) => sum + r.score, 0)

    for (const r of raw) {
      const prob = r.score / total
      const winOdds = roundOdds(Math.max(1.2, (1 / prob) * 0.9))
      bets.push({
        type: 'winner',
        description: `${r.player.name} wins`,
        target_player_id: r.player.id,
        odds: winOdds,
      })
    }
  }

  // ── Hole in one (manual) ──────────────────────────────────────────────────

  bets.push({
    type: 'hole_in_one',
    description: 'Anyone gets a hole in one',
    target_player_id: null,
    odds: tournament.holes >= 18 ? 12.0 : 20.0,
  })

  // ── Defending champion (auto) ─────────────────────────────────────────────

  const priorInSeason = completed
    .filter((t) => t.season_id === tournament.season_id)
    .sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0))

  if (priorInSeason.length > 0) {
    const defenderScore = allScores.find(
      (s) => s.tournament_id === priorInSeason[0].id && s.position === 1
    )
    const defender = defenderScore ? players.find((p) => p.id === defenderScore.player_id) : null
    if (defender) {
      bets.push({
        type: 'defend',
        description: `${defender.name} defends the title`,
        target_player_id: defender.id,
        odds: 3.0,
      })
    }
  }

  // ── Score-based auto-settled bets ─────────────────────────────────────────

  if (completed.length > 0) {
    bets.push({
      type: 'personal_best',
      description: 'Anyone posts a personal best score',
      target_player_id: null,
      odds: 3.0,
    })
  }

  bets.push({
    type: 'big_margin',
    description: 'Winning margin is 5+ strokes',
    target_player_id: null,
    odds: 2.5,
  })

  bets.push({
    type: 'tie_game',
    description: 'Round ends in a tie',
    target_player_id: null,
    odds: 4.0,
  })

  bets.push({
    type: 'close_finish',
    description: 'Top two players finish within 1 stroke',
    target_player_id: null,
    odds: 2.0,
  })

  // ── Funny / behavior (manual) ─────────────────────────────────────────────

  bets.push({
    type: 'duff_tee',
    description: 'Will anyone duff their tee shot on #1?',
    target_player_id: null,
    odds: 2.0,
  })

  bets.push({
    type: 'water_ball',
    description: 'Will someone find the water?',
    target_player_id: null,
    odds: 1.5,
  })

  for (const player of players) {
    bets.push({
      type: 'tilt',
      description: `Will ${player.name} lose their cool?`,
      target_player_id: player.id,
      odds: 2.5,
    })
  }

  if (tournament.holes >= 18) {
    bets.push({
      type: 'front_nine_choke',
      description: 'Someone leads at the turn and loses',
      target_player_id: null,
      odds: 2.5,
    })
  }

  // ── Disaster bets (manual) ────────────────────────────────────────────────

  bets.push({
    type: 'birdie',
    description: 'Will anyone make a birdie?',
    target_player_id: null,
    odds: 2.0,
  })

  bets.push({
    type: 'multi_birdie',
    description: 'Will anyone make 2+ birdies?',
    target_player_id: null,
    odds: 5.0,
  })

  bets.push({
    type: 'lost_balls',
    description: 'Will anyone lose 3+ balls?',
    target_player_id: null,
    odds: 2.0,
  })

  bets.push({
    type: 'bunker_escape',
    description: 'Will anyone take 3+ shots to escape a bunker?',
    target_player_id: null,
    odds: 3.0,
  })

  bets.push({
    type: 'snowman',
    description: 'Will anyone make a 10 or worse on a hole?',
    target_player_id: null,
    odds: 2.5,
  })

  bets.push({
    type: 'four_putt',
    description: 'Will anyone 4-putt?',
    target_player_id: null,
    odds: 3.0,
  })

  if (tournament.holes >= 18) {
    bets.push({
      type: 'three_putt_18',
      description: 'Will anyone 3-putt on the 18th?',
      target_player_id: null,
      odds: 2.0,
    })
  }

  bets.push({
    type: 'double_ob',
    description: 'Will anyone go OB twice?',
    target_player_id: null,
    odds: 2.5,
  })

  bets.push({
    type: 'blade_chip',
    description: 'Will anyone blade a chip across the green?',
    target_player_id: null,
    odds: 2.5,
  })

  bets.push({
    type: 'skull_ob',
    description: 'Will anyone skull a bunker shot OB?',
    target_player_id: null,
    odds: 6.0,
  })

  return bets
}
