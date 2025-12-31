/**
 * 📡 useRealtime Composable
 * 
 * 負責處理 Supabase Realtime 的訂閱與事件處理
 * 實現多人即時協作功能
 */
import { useBoardStore } from '@/stores/boardStore'
import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useRealtime = () => {
  const { $supabase } = useNuxtApp()
  // Explicitly cast $supabase to any to avoid unknown type error if types are missing
  const supabaseClient = $supabase as any
  const boardStore = useBoardStore()
  
  // 保存訂閱通道的參照
  let channel: RealtimeChannel | null = null

  /**
   * 🚀 開始訂閱即時更新
   */
  const subscribe = () => {
    if (channel) return

    console.log('📡 [REALTIME] 開始訂閱即時更新...')

    channel = supabaseClient.channel('public:board')
      // 📋 監聽列表變更
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        (payload: any) => {
          console.log('📡 [REALTIME] 收到列表變更:', payload.eventType, payload)
          handleListChange(payload)
        }
      )
      // 🃏 監聽卡片變更
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        (payload: any) => {
          console.log('📡 [REALTIME] 收到卡片變更:', payload.eventType, payload)
          handleCardChange(payload)
        }
      )
      .subscribe((status: string) => {
        console.log('📡 [REALTIME] 訂閱狀態:', status)
      })
  }

  /**
   * 🛑 取消訂閱
   */
  const unsubscribe = () => {
    if (channel) {
      console.log('📡 [REALTIME] 取消訂閱')
      supabaseClient.removeChannel(channel)
      channel = null
    }
  }

  /**
   * 📋 處理列表變更
   */
  const handleListChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        // 轉換資料格式
        const newList = listRepository.transformApiList(newRecord)
        boardStore.syncAddList(newList)
        break
        
      case 'UPDATE':
        const updatedList = listRepository.transformApiList(newRecord)
        boardStore.syncUpdateList(updatedList)
        break
        
      case 'DELETE':
        boardStore.syncRemoveList(String(oldRecord.id))
        break
    }
  }

  /**
   * 🃏 處理卡片變更
   */
  const handleCardChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        const newCard = cardRepository.transformApiCard(newRecord)
        boardStore.syncAddCard(newCard)
        break
        
      case 'UPDATE':
        const updatedCard = cardRepository.transformApiCard(newRecord)
        boardStore.syncUpdateCard(updatedCard)
        break
        
      case 'DELETE':
        boardStore.syncRemoveCard(String(oldRecord.id))
        break
    }
  }

  return {
    subscribe,
    unsubscribe
  }
}
