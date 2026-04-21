import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Season } from '@/types/db'

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('year', { ascending: false })
      if (error) throw error
      return data as Season[]
    },
  })
}

export function useSeason(id: string | undefined) {
  return useQuery({
    queryKey: ['seasons', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Season
    },
  })
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ['seasons', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .order('year', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Season | null
    },
  })
}

export function useCreateSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Season, 'id' | 'created_at' | 'champion_player_id'>) => {
      const { data, error } = await supabase
        .from('seasons')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data as Season
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seasons'] }),
  })
}

export function useUpdateSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<Omit<Season, 'created_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('seasons')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Season
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seasons'] }),
  })
}

export function useDeleteSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seasons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seasons'] }),
  })
}
