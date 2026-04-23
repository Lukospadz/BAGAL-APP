import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BucksTransaction, PlayerItem } from '@/types/db'

export function useBucksTransactions(playerId: string | undefined) {
  return useQuery({
    queryKey: ['bucks_transactions', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bucks_transactions')
        .select('*')
        .eq('player_id', playerId!)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as BucksTransaction[]
    },
  })
}

export function usePlayerItems(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_items', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_items')
        .select('*')
        .eq('player_id', playerId!)
      if (error) throw error
      return data as PlayerItem[]
    },
  })
}

export function useBuyShopItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      itemName,
      price,
    }: {
      itemId: string
      itemType: 'title' | 'frame'
      itemName: string
      price: number
    }) => {
      const { error } = await supabase.rpc('buy_shop_item', {
        p_item_id: itemId,
        p_item_type: itemType,
        p_item_name: itemName,
        p_price: price,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['player_items'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
    },
  })
}

export function useEquipItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc('equip_item', { p_item_id: itemId })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useUnequipItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (type: 'title' | 'frame') => {
      const { error } = await supabase.rpc('unequip_item', { p_type: type })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  })
}

export function useAdminResetPlayerBucks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.rpc('admin_reset_player_bucks', {
        p_player_id: playerId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['player_items'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
    },
  })
}

export function useAwardTournamentBucks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase.rpc('award_tournament_bucks', {
        p_tournament_id: tournamentId,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['bucks_transactions'] })
      qc.invalidateQueries({ queryKey: ['tournaments'] })
    },
  })
}
