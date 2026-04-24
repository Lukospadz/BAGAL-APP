import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Score } from '@/types/db'

export function useScoresByTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ['scores', 'tournament', tournamentId],
    enabled: !!tournamentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('tournament_id', tournamentId!)
        .order('position', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as Score[]
    },
  })
}

export function useScoresByPlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ['scores', 'player', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('player_id', playerId!)
      if (error) throw error
      return data as Score[]
    },
  })
}

export function useScoresBySeason(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['scores', 'season', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*, tournaments!inner(season_id)')
        .eq('tournaments.season_id', seasonId!)
      if (error) throw error
      return data as Score[]
    },
  })
}

interface UpsertScoresPayload {
  tournamentId: string
  seasonId: string
  entries: {
    playerId: string
    roundScores: number[]
    position: number
    pointsAwarded: number
  }[]
}

export function useUpsertScores() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tournamentId, entries }: UpsertScoresPayload) => {
      // Build upsert rows — one row per player per round
      const rows = entries.flatMap(({ playerId, roundScores, position, pointsAwarded }) =>
        roundScores.map((gross, i) => ({
          tournament_id: tournamentId,
          player_id: playerId,
          round_number: i + 1,
          gross_score: gross,
          position,
          points_awarded: i === 0 ? pointsAwarded : 0, // only award points on round 1 row
        }))
      )

      const { error } = await supabase
        .from('scores')
        .upsert(rows, { onConflict: 'tournament_id,player_id,round_number' })
      if (error) throw error

      // Mark tournament as completed
      const { error: tErr } = await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournamentId)
      if (tErr) throw tErr

      // Award BAGAL Bucks (idempotent — safe to call on re-save)
      await supabase.rpc('award_tournament_bucks', { p_tournament_id: tournamentId })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['scores', 'tournament', vars.tournamentId] })
      qc.invalidateQueries({ queryKey: ['scores', 'season', vars.seasonId] })
      qc.invalidateQueries({ queryKey: ['tournaments', vars.seasonId] })
    },
  })
}

export function useDeleteTournamentScores() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tournamentId, seasonId }: { tournamentId: string; seasonId: string }) => {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('tournament_id', tournamentId)
      if (error) throw error

      const { error: tErr } = await supabase
        .from('tournaments')
        .update({ status: 'upcoming', course: null, date: null, course_rating: null })
        .eq('id', tournamentId)
      if (tErr) throw tErr

      return seasonId
    },
    onSuccess: (seasonId, vars) => {
      qc.invalidateQueries({ queryKey: ['scores', 'tournament', vars.tournamentId] })
      qc.invalidateQueries({ queryKey: ['scores', 'season', seasonId] })
      qc.invalidateQueries({ queryKey: ['tournaments', seasonId] })
    },
  })
}
