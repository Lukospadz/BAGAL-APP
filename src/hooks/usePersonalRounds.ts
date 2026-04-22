import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PersonalRound } from '@/types/db'

export function usePersonalRounds(playerId: string | undefined) {
  return useQuery({
    queryKey: ['personal_rounds', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_rounds')
        .select('*')
        .eq('player_id', playerId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data as PersonalRound[]
    },
  })
}

export function useCreatePersonalRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<PersonalRound, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('personal_rounds')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as PersonalRound
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['personal_rounds', vars.player_id] }),
  })
}

export function useUpdatePersonalRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<PersonalRound, 'created_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('personal_rounds')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PersonalRound
    },
    onSuccess: (data) =>
      qc.invalidateQueries({ queryKey: ['personal_rounds', data.player_id] }),
  })
}

export function useDeletePersonalRound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, playerId }: { id: string; playerId: string }) => {
      const { error } = await supabase.from('personal_rounds').delete().eq('id', id)
      if (error) throw error
      return playerId
    },
    onSuccess: (playerId) =>
      qc.invalidateQueries({ queryKey: ['personal_rounds', playerId] }),
  })
}
