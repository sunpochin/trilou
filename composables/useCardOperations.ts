/**
 * 🃏 useCardOperations = 卡片管理專家 (專門處理卡片的各種操作)
 * 
 * 🤔 想像你在玩卡片遊戲，有很多卡片要管理：
 * 
 * ❌ 沒有專家的世界：
 * - 每次要刪除卡片，都要記住複雜的步驟
 * - 每個地方都要寫一遍「刪除卡片」的程式碼  
 * - 修改卡片名字的方法，每個地方都不一樣
 * - 出錯時不知道該怎麼辦
 * 
 * ✅ 有專家的世界：
 * - 想刪除卡片？叫專家來處理，他知道所有步驟
 * - 想改卡片名字？專家有統一的方法
 * - 想新增卡片？專家幫你處理，還會顯示成功訊息
 * - 出錯了？專家知道怎麼修復，還會告訴你發生什麼事
 * 
 * 📋 這個專家會什麼技能？
 * 1. 🗑️ 安全刪除卡片 (會檢查是否成功，失敗時會告訴你)
 * 2. ✏️ 聰明改名字 (立刻改，出錯時會自動改回來)  
 * 3. 📌 快速新增卡片 (加完會告訴你成功了)
 * 4. 🚨 錯誤處理專家 (出錯時會顯示友善的錯誤訊息)
 * 
 * 🎯 誰需要這個專家？
 * - ListItem.vue (列表裡的卡片操作)
 * - MobileBoard.vue (手機版的卡片管理)  
 * - DesktopBoard.vue (桌面版的卡片管理)
 * 
 * 💡 為什麼需要專家？
 * - 統一的操作方式，不會搞混
 * - 自動處理錯誤，用戶體驗更好
 * - 一個地方修改，所有地方都受益
 */

import { useCardActions } from '@/composables/useCardActions'
import { eventBus } from '@/events/EventBus'
import type { CardUI } from '@/types'

/**
 * 卡片操作的通用邏輯
 * 可在 ListItem、MobileBoard、DesktopBoard 中重用
 */
export function useCardOperations() {
  const {
    deleteCard: deleteCardAction,
    updateCardTitle: updateCardTitleAction,
    addCard: addCardAction
  } = useCardActions()

  /**
   * 刪除卡片（返回刪除信息供調用者處理 undo）
   */
  const handleCardDelete = async (card: CardUI | string) => {
    // deleteCardAction 需要完整的 CardUI 物件，不能只傳 ID
    if (typeof card === 'string') {
      console.error('❌ [CARD-OPS] handleCardDelete 需要完整的卡片物件，不能只傳 ID')
      throw new Error('需要完整的卡片物件')
    }
    
    console.log('🗑️ [CARD-OPS] 處理卡片刪除:', card.title)
    
    try {
      // 刪除卡片並獲取恢復信息
      const deleteInfo = await deleteCardAction(card)
      
      if (!deleteInfo) {
        throw new Error('無法獲取卡片刪除信息')
      }
      
      console.log('✅ [CARD-OPS] 卡片刪除處理完成，返回刪除信息')
      return deleteInfo
      
    } catch (error) {
      console.error('❌ [CARD-OPS] 卡片刪除處理失敗:', error)
      eventBus.emit('notification:error', {
        title: '刪除失敗',
        message: '無法刪除卡片，請稍後再試',
        duration: 5000
      })
      throw error // 重新拋出錯誤，讓調用者知道操作失敗
    }
  }

  /**
   * 更新卡片標題（樂觀更新）
   */
  const handleCardUpdateTitle = async (cardId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    console.log('✏️ [CARD-OPS] 更新卡片標題:', { cardId, newTitle })
    
    // 樂觀更新 - 不等待結果
    updateCardTitleAction(cardId, newTitle).catch(error => {
      console.error('❌ [CARD-OPS] 卡片標題更新失敗:', error)
      eventBus.emit('notification:error', {
        title: '更新失敗',
        message: '無法更新卡片標題，請稍後再試'
      })
    })
    
    console.log('⚡ [CARD-OPS] 卡片標題樂觀更新完成')
  }

  /**
   * 新增卡片
   */
  const handleCardAdd = async (
    listId: string, 
    title: string, 
    description?: string
  ): Promise<void> => {
    if (!title.trim()) return
    
    console.log('📌 [CARD-OPS] 新增卡片:', { listId, title })
    
    try {
      await addCardAction(listId, title, description)
      console.log('✅ [CARD-OPS] 卡片新增成功')
      
      eventBus.emit('notification:success', {
        title: '新增成功',
        message: '卡片已新增'
      })
    } catch (error) {
      console.error('❌ [CARD-OPS] 新增卡片失敗:', error)
      eventBus.emit('notification:error', {
        title: '新增失敗',
        message: '無法新增卡片，請檢查網路連線後再試',
        duration: 5000
      })
      throw error
    }
  }

  /**
   * 批量新增卡片（用於 AI 生成等場景）
   */
  const handleBatchCardAdd = async (
    listId: string,
    cards: Array<{ title: string; description?: string }>
  ) => {
    console.log(`📦 [CARD-OPS] 批量新增 ${cards.length} 張卡片到列表 ${listId}`)
    
    const results = {
      success: 0,
      failed: 0
    }
    
    for (const card of cards) {
      try {
        await addCardAction(listId, card.title, card.description)
        results.success++
      } catch (error) {
        console.error('❌ [CARD-OPS] 新增卡片失敗:', card.title, error)
        results.failed++
      }
    }
    
    // 顯示批量操作結果
    if (results.success > 0 && results.failed === 0) {
      eventBus.emit('notification:success', {
        title: '批量新增成功',
        message: `成功新增 ${results.success} 張卡片`
      })
    } else if (results.failed > 0) {
      eventBus.emit('notification:warning', {
        title: '部分新增失敗',
        message: `成功 ${results.success} 張，失敗 ${results.failed} 張`
      })
    }
    
    return results
  }

  return {
    handleCardDelete,
    handleCardUpdateTitle,
    handleCardAdd,
    handleBatchCardAdd
  }
}