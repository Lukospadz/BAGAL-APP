import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CasualRound } from '@/types/db'

export function useCasualRounds(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['casual_rounds', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('casual_rounds')
        .select('*')
        .eq('season_id', seasonId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data as CasualRound[]
    },
  })
}

export function useCreateCasualRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<CasualRound, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('casual_rounds')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as CasualRound
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['casual_rounds', vars.season_id] }),
  })
}

export function useDeleteCasualRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, seasonId }: { id: string; seasonId: string }) => {
      const { error } = await supabase.from('casual_rounds').delete().eq('id', id)
      if (error) throw error
      return seasonId
    },
    onSuccess: (seasonId) =>
      qc.invalidateQueries({ queryKey: ['casual_rounds', seasonId] }),
  })
}
