import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { computeProps } from '@/lib/odds'
import { usePlayers } from '@/hooks/usePlayers'
import { useTournaments } from '@/hooks/useTournaments'
import { useScoresBySeason } from '@/hooks/useScores'
import type { PropBet, PlayerBet, Tournament } from '@/types/db'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlayerBetWithProp extends PlayerBet {
  prop_bets: PropBet & {
    tournaments: Pick<Tournament, 'id' | 'name' | 'date' | 'season_id'>
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export function usePropBets(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['prop_bets', tournamentId],
    enabled: !!tournamentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prop_bets')
        .select('*, player_bets(id, player_id, amount, potential_payout, status)')
        .eq('tournament_id', tournamentId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as (PropBet & { player_bets: Pick<PlayerBet, 'id' | 'player_id' | 'amount' | 'potential_payout' | 'status'>[] })[]
    },
  })
}

export function useAllOpenProps() {
  return useQuery({
    queryKey: ['prop_bets', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prop_bets')
        .select('*, tournaments(id, name, date, season_id, status)')
        .eq('status', 'open')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as (PropBet & { tournaments: Pick<Tournament, 'id' | 'name' | 'date' | 'season_id' | 'status'> })[]
    },
  })
}

export function usePlayerBets(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_bets', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_bets')
        .select('*, prop_bets(*, tournaments(id, name, date, season_id))')
        .eq('player_id', playerId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PlayerBetWithProp[]
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function usePlaceBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      propBetId,
      playerId,
      amount,
    }: {
      propBetId: string
      playerId: string
      amount: number
    }) => {
      const { error } = await supabase.rpc('place_bet', {
        p_prop_bet_id: propBetId,
        p_player_id: playerId,
        p_amount: amount,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, { propBetId, playerId }) => {
      qc.invalidateQueries({ queryKey: ['prop_bets'] })
      qc.invalidateQueries({ queryKey: ['player_bets', playerId] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions', playerId] })
      void propBetId
    },
  })
}

export function useSettleTournamentBets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase.rpc('settle_tournament_bets', {
        p_tournament_id: tournamentId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prop_bets'] })
      qc.invalidateQueries({ queryKey: ['player_bets'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
    },
  })
}

// Admin: compute odds from history and save all bets for a tournament
export function useGenerateProps(seasonId: string | undefined, tournament: Tournament | undefined) {
  const qc = useQueryClient()
  const { data: players } = usePlayers()
  const { data: allTournaments } = useTournaments(seasonId)
  // We need scores across the whole season
  const { data: allScores } = useScoresBySeason(seasonId)

  return useMutation({
    mutationFn: async () => {
      if (!tournament || !players || !allTournaments || !allScores) {
        throw new Error('Data not ready')
      }
      const bets = computeProps(tournament, players, allScores, allTournaments)
      const { error } = await supabase.rpc('save_prop_bets', {
        p_tournament_id: tournament.id,
        p_bets: bets,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prop_bets', tournament?.id] })
    },
  })
}

// Admin: update a single bet's description and odds
export function useUpdatePropBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      betId,
      description,
      odds,
    }: {
      betId: string
      description: string
      odds: number
    }) => {
      const { error } = await supabase.rpc('update_prop_bet', {
        p_bet_id: betId,
        p_description: description,
        p_odds: odds,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prop_bets'] }),
  })
}

// Admin: add a single custom bet directly
export function useAddPropBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      tournamentId,
      type,
      description,
      targetPlayerId,
      odds,
    }: {
      tournamentId: string
      type: string
      description: string
      targetPlayerId: string | null
      odds: number
    }) => {
      const { error } = await supabase.from('prop_bets').insert({
        tournament_id: tournamentId,
        type,
        description,
        target_player_id: targetPlayerId || null,
        odds,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prop_bets'] }),
  })
}

// Admin: delete a single open bet with no wagers (or void to refund wagers)
export function useDeletePropBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (betId: string) => {
      const { error } = await supabase.from('prop_bets').delete().eq('id', betId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prop_bets'] }),
  })
}

// Admin: void a bet and refund all wagers
export function useVoidPropBet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (betId: string) => {
      const { error } = await supabase.rpc('void_prop_bet', { p_bet_id: betId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prop_bets'] })
      qc.invalidateQueries({ queryKey: ['player_bets'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
    },
  })
}

// Admin: manually resolve a single bet result (e.g. hole_in_one)
export function useMarkPropResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ betId, won }: { betId: string; won: boolean }) => {
      const { error } = await supabase.rpc('mark_prop_result', {
        p_bet_id: betId,
        p_won: won,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prop_bets'] })
      qc.invalidateQueries({ queryKey: ['player_bets'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
    },
  })
}
