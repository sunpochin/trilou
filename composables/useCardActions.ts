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
import { eventBus } from '@/events/EventBus'

export const useCardActions = () => {
  const boardStore = useBoardStore()
  const { showConfirm } = useConfirmDialog()

  /**
   * 🗑️ 刪除卡片功能
   * 
   * 具備樂觀 UI 更新與完整的錯誤回滾機制
   * 成功後會自動重新整理列表位置排序
   * 
   * @param card 要刪除的卡片
   * @returns Promise<boolean> 是否刪除成功
   */
  const deleteCard = async (card: CardUI): Promise<boolean> => {
    console.log('🗑️ [CARD-ACTION] deleteCard 被呼叫，卡片:', card)
    
    // 顯示確認對話框
    console.log('💬 [CARD-ACTION] 顯示刪除確認對話框...')
    const confirmed = await showConfirm({
      title: MESSAGES.card.delete,
      message: MESSAGES.card.deleteConfirm.replace('{title}', card.title),
      confirmText: MESSAGES.dialog.delete,
      cancelText: MESSAGES.dialog.cancel,
      dangerMode: true
    })
    
    if (!confirmed) {
      console.log('❌ [CARD-ACTION] 用戶取消刪除操作')
      return false
    }
    
    console.log('✅ [CARD-ACTION] 用戶確認刪除，開始樂觀 UI 刪除流程...')
    
    // 🎯 記錄原始狀態以便錯誤回滾
    let sourceList: any = null
    let originalCardIndex = -1
    let originalCard = { ...card }
    
    try {
      console.log('📤 [CARD-ACTION] 發送 DELETE API 請求到:', `/api/cards/${card.id}`)
      
      // 🎯 樂觀 UI：先從本地狀態移除卡片
      console.log('🔄 [CARD-ACTION] 樂觀更新：從列表中移除卡片...')
      
      for (const list of boardStore.board.lists) {
        const cardIndex = list.cards.findIndex(c => c.id === card.id)
        if (cardIndex !== -1) {
          console.log(`📋 [CARD-ACTION] 在列表 \"${list.title}\" 中找到卡片，索引: ${cardIndex}`)
          
          // 保存原始狀態用於回滾
          sourceList = list
          originalCardIndex = cardIndex
          
          // 樂觀移除
          list.cards.splice(cardIndex, 1)
          console.log('✅ [CARD-ACTION] 卡片已從本地狀態移除（樂觀更新）')
          break
        }
      }
      
      // 🎯 呼叫 API 刪除卡片
      await $fetch(`/api/cards/${card.id}`, {
        method: 'DELETE'
      })
      console.log('✅ [CARD-ACTION] API 刪除請求成功')
      
      // 🎯 成功後重新整理受影響列表的位置
      if (sourceList) {
        console.log('🔧 [CARD-ACTION] 重新整理列表位置排序...')
        await boardStore.moveCardAndReorder([sourceList.id])
        console.log('✅ [CARD-ACTION] 位置重新排序完成')
      }
      
      console.log('🎉 [CARD-ACTION] 卡片刪除流程完成')
      return true
      
    } catch (error) {
      console.error('❌ [CARD-ACTION] 刪除卡片過程中發生錯誤，執行回滾...')
      console.error('  🔍 錯誤類型:', typeof error)
      console.error('  🔍 錯誤內容:', error)
      
      // 🎯 錯誤回滾：恢復原始狀態
      if (sourceList && originalCardIndex !== -1) {
        console.log('🔄 [CARD-ACTION] 回滾：恢復卡片到原始位置')
        sourceList.cards.splice(originalCardIndex, 0, originalCard)
        console.log('✅ [CARD-ACTION] 卡片已恢復到原始狀態')
      }
      
      if (error && typeof error === 'object') {
        console.error('  🔍 錯誤詳情:', {
          message: (error as any).message,
          statusCode: (error as any).statusCode,
          statusMessage: (error as any).statusMessage,
          data: (error as any).data
        })
      }
      
      // 使用 EventBus 通知系統替代笑閉的 alert
      eventBus.emit('notification:error', {
        title: '卡片移動失敗',
        message: MESSAGES.card.moveError,
        duration: 5000
      })
      console.log('💥 [CARD-ACTION] 錯誤處理與回滾完成')
      return false
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
   * @returns Promise<void>
   */
  const addCard = async (listId: string, title: string, status?: string, description?: string) => {
    try {
      console.log('➕ [CARD-ACTION] 新增卡片:', { listId, title, status, description })
      
      await boardStore.addCard(listId, title, status, description)
      
      console.log('✅ [CARD-ACTION] 卡片新增成功')
    } catch (error) {
      console.error('❌ [CARD-ACTION] 新增卡片失敗:', error)
      throw error // 重新拋出錯誤讓調用者處理
    }
  }

  return {
    deleteCard,
    updateCardTitle,
    updateCardDescription,
    addCard
  }
}