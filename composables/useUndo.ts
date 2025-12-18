/**
 * 🔄 useUndo = 復原操作管理專家 (讓用戶可以反悔剛才的操作)
 * 
 * 🤔 想像你在玩積木，不小心拆掉了一個部分：
 * 
 * ❌ 沒有復原功能的世界：
 * - 拆掉了？完蛋了，要重新來
 * - 不敢嘗試，怕做錯
 * - 壓力很大，每次操作都要很小心
 * 
 * ✅ 有復原功能的世界：
 * - 拆掉了？沒關係，有「復原」按鈕
 * - 敢於嘗試，知道可以反悔
 * - 操作流暢，不用擔心犯錯
 * 
 * 📋 這個專家會什麼技能？
 * 1. 🗃️ 記住被刪除的東西 (暫時存放，還沒真的丟掉)
 * 2. ⏰ 設定時間限制 (10秒內可以反悔，超過就真的刪掉)
 * 3. 🔄 提供復原功能 (點按鈕就能拿回來)
 * 4. 🧹 自動清理 (時間到了自動丟掉，節省記憶體)
 * 
 * 🎯 哪裡會用到這個專家？
 * - 刪除卡片時顯示「已封存，可復原」
 * - 刪除列表時顯示「已移除，可復原」
 * - 批量操作時提供整體復原
 * 
 * 💡 為什麼需要專家？
 * - 用戶體驗更友善，允許犯錯
 * - 減少誤操作的焦慮感
 * - 符合現代應用的交互習慣
 * - 統一的復原機制，不會搞混
 */

import { ref, reactive } from 'vue'
import { logger } from '@/utils/logger'
import type { CardUI } from '@/types'

// 🎯 被刪除項目的資料結構
interface DeletedItem {
  id: string
  type: 'card' | 'list'
  data: any  // 存放原始資料
  restoreInfo: {
    listId: string       // 原來在哪個列表
    position: number     // 原來的位置
    timestamp: number    // 刪除時間戳
  }
}

// 🎯 Toast 顯示狀態
interface ToastState {
  visible: boolean
  message: string
  itemId: string | null
}

/**
 * 復原操作管理 composable
 * 處理刪除、暫存、復原的完整流程
 */
export function useUndo() {
  // 🗃️ 被刪除項目的暫存區 (還沒真的刪掉，可以復原)
  const deletedItems = reactive<Map<string, DeletedItem>>(new Map())
  
  // 🎨 Toast 通知的顯示狀態
  const toastState = reactive<ToastState>({
    visible: false,
    message: '',
    itemId: null
  })

  // ⏰ 自動清理計時器 (超過時間就真的刪掉)
  const cleanupTimers = new Map<string, NodeJS.Timeout>()

  /**
   * 🗑️ 軟刪除卡片 (暫時移除，但還可以復原)
   * 就像把東西丟到垃圾桶，但垃圾桶還沒倒掉
   */
  const softDeleteCard = (card: CardUI, listId: string, position: number) => {
    logger.debug('[UNDO] 軟刪除卡片:', { cardTitle: card.title, listId, position })
    
    // 存放到暫存區
    const deletedItem: DeletedItem = {
      id: card.id,
      type: 'card',
      data: { ...card },
      restoreInfo: {
        listId,
        position,
        timestamp: Date.now()
      }
    }
    
    deletedItems.set(card.id, deletedItem)
    
    // 顯示 Toast 通知
    showToast(`卡片「${card.title}」已封存`, card.id)
    
    // 設定自動清理 (10秒後真的刪掉)
    scheduleCleanup(card.id, 10000)
    
    logger.info('[UNDO] 卡片已軟刪除，可在 10 秒內復原')
  }

  /**
   * 🔄 復原被刪除的項目
   * 就像從垃圾桶把東西拿回來
   */
  const undoDelete = (itemId: string): DeletedItem | null => {
    logger.debug('[UNDO] 準備復原項目:', itemId)
    
    const deletedItem = deletedItems.get(itemId)
    if (!deletedItem) {
      logger.error('[UNDO] 找不到要復原的項目:', itemId)
      return null
    }
    
    // 從暫存區移除 (因為要復原了)
    deletedItems.delete(itemId)
    
    // 取消自動清理
    cancelCleanup(itemId)
    
    // 隱藏 Toast
    hideToast()
    
    logger.info('[UNDO] 項目復原成功:', deletedItem.data.title || itemId)
    return deletedItem
  }

  /**
   * 🎨 顯示 Toast 通知
   * 告訴用戶「東西已經移除，但還可以復原」
   */
  const showToast = (message: string, itemId: string) => {
    logger.debug('[UNDO] 顯示 Toast 通知:', message)
    
    toastState.visible = true
    toastState.message = message
    toastState.itemId = itemId
  }

  /**
   * 🙈 隱藏 Toast 通知
   */
  const hideToast = () => {
    logger.debug('[UNDO] 隱藏 Toast 通知')
    
    toastState.visible = false
    toastState.message = ''
    toastState.itemId = null
  }

  /**
   * ⏰ 安排自動清理 (超過時間就真的刪掉)
   * 就像垃圾車定時來收垃圾
   */
  const scheduleCleanup = (itemId: string, delay: number) => {
    logger.debug(`[UNDO] 安排 ${delay}ms 後清理項目:`, itemId)

    // 先取消之前的計時器 (如果有的話)
    cancelCleanup(itemId)

    // 設定新的計時器
    const timer = setTimeout(async () => {
      logger.debug('[UNDO] 自動清理時間到，永久刪除項目:', itemId)
      await permanentDelete(itemId)
    }, delay)

    cleanupTimers.set(itemId, timer)
  }

  /**
   * 🚫 取消自動清理 (因為用戶要復原了)
   */
  const cancelCleanup = (itemId: string) => {
    const timer = cleanupTimers.get(itemId)
    if (timer) {
      logger.debug('[UNDO] 取消自動清理:', itemId)
      clearTimeout(timer)
      cleanupTimers.delete(itemId)
    }
  }

  /**
   * 🔥 永久刪除 (真的刪掉，無法復原)
   * 就像垃圾車把垃圾載走了
   */
  const permanentDelete = async (itemId: string) => {
    logger.info('[UNDO] 永久刪除項目:', itemId)

    const deletedItem = deletedItems.get(itemId)

    // 如果是卡片類型，呼叫後端 API 永久刪除
    if (deletedItem && deletedItem.type === 'card') {
      try {
        // 動態引入 CardRepository 以避免循環依賴
        const { cardRepository } = await import('@/repositories/CardRepository')
        await cardRepository.deleteCard(itemId)
        logger.info('[UNDO] 後端卡片刪除成功:', itemId)
      } catch (error) {
        logger.error('[UNDO] 後端卡片刪除失敗:', error)
        // 發送錯誤通知
        const { eventBus } = await import('@/events/EventBus')
        eventBus.emit('notification:error', {
          title: '永久刪除失敗',
          message: '無法從伺服器刪除卡片，請稍後再試',
          duration: 5000
        })
      }
    } else if (deletedItem && deletedItem.type === 'list') {
      // 處理列表類型的永久刪除（如果未來有軟刪除列表的需求）
      try {
        const { listRepository } = await import('@/repositories/ListRepository')
        await listRepository.deleteList(itemId)
        logger.info('[UNDO] 後端列表刪除成功:', itemId)
      } catch (error) {
        logger.error('[UNDO] 後端列表刪除失敗:', error)
      }
    }

    deletedItems.delete(itemId)
    cancelCleanup(itemId)

    // 如果這個項目的 Toast 還在顯示，就隱藏它
    if (toastState.itemId === itemId) {
      hideToast()
    }
  }

  /**
   * 🧹 清理所有暫存項目 (用於組件銷毀時)
   */
  const cleanup = () => {
    logger.debug('[UNDO] 清理所有暫存項目和計時器')
    
    // 清理所有計時器
    cleanupTimers.forEach(timer => clearTimeout(timer))
    cleanupTimers.clear()
    
    // 清理所有暫存項目
    deletedItems.clear()
    
    // 隱藏 Toast
    hideToast()
  }

  /**
   * 📊 取得目前暫存的項目數量 (除錯用)
   */
  const getDeletedItemsCount = () => deletedItems.size

  /**
   * 🔍 檢查特定項目是否在暫存區 (除錯用)
   */
  const hasDeletedItem = (itemId: string) => deletedItems.has(itemId)

  // 🔄 註冊瀏覽器關閉事件，確保在關閉前執行所有待處理的刪除
  if (process.client) {
    window.addEventListener('beforeunload', () => {
      // 當頁面關閉時，嘗試對所有待刪除項目執行永久刪除
      // 注意：這在某些瀏覽器可能不保證完成所有非同步請求
      // 但對於 Supabase/fetch 來說，這能提高成功機率
      deletedItems.forEach((_, itemId) => {
        permanentDelete(itemId)
      })
    })
  }

  return {
    // 狀態
    toastState,
    
    // 主要操作
    softDeleteCard,
    undoDelete,
    
    // Toast 控制
    showToast,
    hideToast,
    
    // 清理
    cleanup,
    
    // 除錯工具
    getDeletedItemsCount,
    hasDeletedItem
  }
}