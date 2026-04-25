import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ProspectCourse {
  id: string
  player_id: string
  name: string
  location: string | null
  notes: string | null
  created_at: string
  players: { name: string; initials: string; color: string }
}

export function useProspectCourses() {
  return useQuery({
    queryKey: ['prospect_courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_courses')
        .select('*, players(name, initials, color)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ProspectCourse[]
    },
  })
}

export function useAddProspectCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ playerId, name, location, notes }: {
      playerId: string
      name: string
      location: string | null
      notes: string | null
    }) => {
      const { error } = await supabase
        .from('prospect_courses')
        .insert({ player_id: playerId, name, location, notes })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospect_courses'] }),
  })
}

export function useDeleteProspectCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prospect_courses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospect_courses'] }),
  })
}
