import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Player } from '@/types/db'

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Player[]
    },
  })
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ['players', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Player
    },
  })
}

export function useCreatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Player, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('players')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useUpdatePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<Player, 'created_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('players')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Player
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['players', vars.id] }),
  })
}

export function useDeletePlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('players').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}
