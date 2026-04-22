import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface AdminProfileRow {
  id: string
  email: string
  role: 'admin' | 'player'
  player_id: string | null
  created_at: string
}

export function useAdminProfiles() {
  return useQuery({
    queryKey: ['admin_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_profiles')
      if (error) throw error
      return (data ?? []) as AdminProfileRow[]
    },
  })
}

export function useLinkProfileToPlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profileId, playerId }: { profileId: string; playerId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ player_id: playerId })
        .eq('id', profileId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_profiles'] }),
  })
}

export function useSetProfileRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ profileId, role }: { profileId: string; role: 'admin' | 'player' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', profileId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_profiles'] }),
  })
}
