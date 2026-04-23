import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FavouriteCourse } from '@/types/db'

export function useFavouriteCourses(playerId: string | undefined) {
  return useQuery({
    queryKey: ['favourite_courses', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favourite_courses')
        .select('*')
        .eq('player_id', playerId!)
        .order('rank')
      if (error) throw error
      return data as FavouriteCourse[]
    },
  })
}

export function useUpsertFavouriteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      playerId,
      rank,
      name,
      notes,
      photoUrl,
    }: {
      playerId: string
      rank: number
      name: string
      notes?: string | null
      photoUrl?: string | null
    }) => {
      const { error } = await supabase
        .from('favourite_courses')
        .upsert(
          { player_id: playerId, rank, name, notes: notes ?? null, photo_url: photoUrl ?? null },
          { onConflict: 'player_id,rank' }
        )
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['favourite_courses', vars.playerId] }),
  })
}

export function useDeleteFavouriteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, playerId }: { id: string; playerId: string }) => {
      const { error } = await supabase
        .from('favourite_courses')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['favourite_courses', vars.playerId] }),
  })
}

export function useUploadCoursePhoto() {
  return useMutation({
    mutationFn: async ({
      playerId,
      rank,
      file,
    }: {
      playerId: string
      rank: number
      file: File
    }) => {
      const path = `${playerId}/${rank}`
      await supabase.storage.from('course-photos').remove([path])
      const { error } = await supabase.storage
        .from('course-photos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw new Error(error.message)
      const { data } = supabase.storage.from('course-photos').getPublicUrl(path)
      // Bust cache with timestamp
      return `${data.publicUrl}?t=${Date.now()}`
    },
  })
}
