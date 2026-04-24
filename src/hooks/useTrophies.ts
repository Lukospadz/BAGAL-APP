import { useMemo } from 'react'
import { usePlayer } from './usePlayers'
import { usePersonalRounds } from './usePersonalRounds'
import { useScoresByPlayer } from './useScores'
import { useSeasons } from './useSeasons'
import { TROPHY_CATALOG, type TrophyContext } from '@/lib/trophies'

export function usePlayerTrophies(playerId: string | undefined) {
  const { data: player, isLoading: pL } = usePlayer(playerId)
  const { data: personalRounds, isLoading: rL } = usePersonalRounds(playerId)
  const { data: scores, isLoading: sL } = useScoresByPlayer(playerId)
  const { data: seasons, isLoading: seL } = useSeasons()

  const isLoading = pL || rL || sL || seL

  const trophies = useMemo(() => {
    if (!player || !personalRounds || !scores || !seasons) return []
    const ctx: TrophyContext = { player, personalRounds, scores, seasons }
    return TROPHY_CATALOG.map((t) => ({ ...t, unlocked: t.check(ctx) }))
  }, [player, personalRounds, scores, seasons])

  return { trophies, isLoading }
}
