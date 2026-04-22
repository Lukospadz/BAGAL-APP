import { useMemo } from 'react'
import { usePlayers } from './usePlayers'
import { useTournaments } from './useTournaments'
import { useScoresBySeason } from './useScores'
import { useCasualRounds } from './useCasualRounds'
import { computeStandings, type PlayerStanding } from '@/lib/scoring'

export function useStandings(seasonId: string | undefined): {
  standings: PlayerStanding[]
  isLoading: boolean
} {
  const { data: players, isLoading: p } = usePlayers()
  const { data: tournaments, isLoading: t } = useTournaments(seasonId)
  const { data: scores, isLoading: s } = useScoresBySeason(seasonId)
  const { data: casual, isLoading: c } = useCasualRounds(seasonId)

  const standings = useMemo(() => {
    if (!players || !tournaments || !scores || !casual) return []
    return computeStandings(players, tournaments, scores, casual)
  }, [players, tournaments, scores, casual])

  return {
    standings,
    isLoading: p || t || s || c,
  }
}
