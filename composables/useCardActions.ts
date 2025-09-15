/**
 * 🎯 卡片操作業務邏輯 Composable
 * 
 * 將卡片的各種操作邏輯集中管理，遵循單一職責原則
 * 提供樂觀 UI 更新與錯誤回滾機制
 * 
 * 📝 使用方式：
 * const { deleteCard, moveCard } = useCardActions()
 */

import { useBoardStore } from '@/stores/boardStore'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { MESSAGES } from '@/constants/messages'
import type { CardUI } from '@/types'
import { CardStatus, CardPriority } from '@/types/api'
import { eventBus } from '@/events/EventBus'

export const useCardActions = () => {
  const boardStore = useBoardStore()
  const { showConfirm } = useConfirmDialog()

  /**
   * 🗑️ 準備刪除卡片功能 (返回刪除信息)
   * 
   * 從 UI 移除卡片並返回恢復所需的信息
   * 由調用者決定如何處理 undo 系統
   * 
   * @param card 要刪除的卡片
   * @returns 刪除信息 (listId, position, card) 或 null 如果失敗
   */
  const deleteCard = async (card: CardUI): Promise<{ listId: string, position: number, card: CardUI } | null> => {
    console.log('🗑️ [CARD-ACTION] 準備刪除卡片:', card.title)
    
    // 🔍 找到卡片的原始位置
    let sourceListId: string | null = null
    let originalPosition: number = -1
    
    for (const list of boardStore.board.lists) {
      const cardIndex = list.cards.findIndex(c => c.id === card.id)
      if (cardIndex !== -1) {
        console.log(`📋 [CARD-ACTION] 找到卡片在列表 "${list.title}" 位置 ${cardIndex}`)
        sourceListId = list.id
        originalPosition = cardIndex
        
        // 🎯 樂觀 UI：立即從列表中移除卡片
        list.cards.splice(cardIndex, 1)
        console.log('✅ [CARD-ACTION] 卡片已從 UI 移除（樂觀更新）')
        break
      }
    }
    
    if (!sourceListId) {
      console.error('❌ [CARD-ACTION] 找不到卡片所在的列表')
      return null
    }
    
    console.log('🎉 [CARD-ACTION] 卡片刪除準備完成，返回恢復信息')
    return {
      listId: sourceListId,
      position: originalPosition,
      card: { ...card }
    }
  }

  /**
   * 📝 更新卡片標題
   * 
   * 使用 async/await 確保操作完成，準備未來的 API 整合
   * 提供更好的錯誤處理和用戶體驗
   * 
   * @param cardId 卡片 ID
   * @param newTitle 新標題
   */
  const updateCardTitle = async (cardId: string, newTitle: string) => {
    try {
      console.log('📝 [CARD-ACTION] 更新卡片標題:', { cardId, newTitle })
      
      // 目前是同步更新本地狀態，未來可以加入 API 請求
      boardStore.updateCardTitle(cardId, newTitle)
      
      console.log('✅ [CARD-ACTION] 卡片標題更新成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 更新卡片標題失敗:', error)
      throw error // 重新拋出錯誤讓調用者處理
    }
  }

  /**
   * 📄 更新卡片描述
   * 
   * 使用 async/await 確保操作完成，準備未來的 API 整合
   * 提供更好的錯誤處理和用戶體驗
   * 
   * @param cardId 卡片 ID
   * @param newDescription 新描述
   */
  const updateCardDescription = async (cardId: string, newDescription: string) => {
    try {
      console.log('📄 [CARD-ACTION] 更新卡片描述:', { cardId, newDescription })
      
      // 目前是同步更新本地狀態，未來可以加入 API 請求
      boardStore.updateCardDescription(cardId, newDescription)
      
      console.log('✅ [CARD-ACTION] 卡片描述更新成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 更新卡片描述失敗:', error)
      throw error // 重新拋出錯誤讓調用者處理
    }
  }

  /**
   * ➕ 新增卡片功能
   * 
   * 遵循依賴反轉原則，透過 composable 封裝 store 操作
   * 支援完整的卡片資料包含描述欄位
   * 
   * @param listId 目標列表 ID
   * @param title 卡片標題
   * @param status 卡片狀態 (可選)
   * @param description 卡片描述 (可選)
   * @param priority 卡片優先級 (可選)
   * @returns Promise<void>
   */
  const addCard = async (listId: string, title: string, status?: string, description?: string, priority?: string) => {
    try {
      console.log('➕ [CARD-ACTION] 新增卡片:', { listId, title, status, description, priority })
      
      await boardStore.addCard(listId, title, status, description, priority)
      
      console.log('✅ [CARD-ACTION] 卡片新增成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 新增卡片失敗:', error)
      throw error // 重新拋出錯誤讓調用者處理
    }
  }

  /**
   * 🔄 更新卡片狀態
   * 
   * 提供樂觀更新與錯誤處理，遵循依賴反轉原則
   * 
   * @param cardId 卡片 ID
   * @param status 新狀態
   * @returns Promise<void>
   */
  const updateCardStatus = async (cardId: string, status: CardStatus) => {
    console.log('🔄 [CARD-ACTION] 更新卡片狀態:', { cardId, status })
    
    try {
      // 樂觀更新本地狀態
      boardStore.updateCardStatus(cardId, status)
      
      // 背景同步到資料庫
      await $fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        body: { status }
      })
      
      console.log('✅ [CARD-ACTION] 狀態更新成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 更新狀態失敗:', error)
      
      // 顯示錯誤通知
      eventBus.emit('notification:error', {
        title: '狀態更新失敗',
        message: '無法更新卡片狀態，請稍後再試',
        duration: 5000
      })
      
      throw error
    }
  }

  /**
   * ⭐ 更新卡片優先順序
   * 
   * 提供樂觀更新與錯誤處理，遵循依賴反轉原則
   * 
   * @param cardId 卡片 ID
   * @param priority 新優先順序
   * @returns Promise<void>
   */
  const updateCardPriority = async (cardId: string, priority: CardPriority) => {
    console.log('⭐ [CARD-ACTION] 更新卡片優先順序:', { cardId, priority })
    
    try {
      // 樂觀更新本地狀態
      boardStore.updateCardPriority(cardId, priority)
      
      // 背景同步到資料庫
      await $fetch(`/api/cards/${cardId}`, {
        method: 'PUT',
        body: { priority }
      })
      
      console.log('✅ [CARD-ACTION] 優先順序更新成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 更新優先順序失敗:', error)
      
      // 顯示錯誤通知
      eventBus.emit('notification:error', {
        title: '優先順序更新失敗',
        message: '無法更新卡片優先順序，請稍後再試',
        duration: 5000
      })
      
      throw error
    }
  }

  return {
    deleteCard,
    updateCardTitle,
    updateCardDescription,
    updateCardStatus,
    updateCardPriority,
    addCard
  }
}