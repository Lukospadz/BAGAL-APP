import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tournament } from '@/types/db'

export function useTournaments(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['tournaments', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('season_id', seasonId!)
        .order('sort_order')
      if (error) throw error
      return data as Tournament[]
    },
  })
}

export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: ['tournament', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Tournament
    },
  })
}

export function useCreateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Tournament, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('tournaments')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Tournament
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['tournaments', vars.season_id] }),
  })
}

export function useUpdateTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<Tournament, 'created_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('tournaments')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Tournament
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ['tournaments', data.season_id] }),
  })
}

export function useDeleteTournament() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, seasonId }: { id: string; seasonId: string }) => {
      const { error } = await supabase.from('tournaments').delete().eq('id', id)
      if (error) throw error
      return seasonId
    },
    onSuccess: (seasonId) =>
      qc.invalidateQueries({ queryKey: ['tournaments', seasonId] }),
  })
}
