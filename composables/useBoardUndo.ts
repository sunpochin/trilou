/**
 * 🔄 useBoardUndo = 看板復原系統管理員
 *
 * 🤔 想像你在看板上操作，有時會不小心刪除卡片：
 *
 * ❌ 沒有管理員的世界：
 * - 手機版和桌面版各自實作 undo 邏輯
 * - 重複的程式碼很多，維護困難
 * - 修改 undo 邏輯需要改多個地方
 *
 * ✅ 有管理員的世界：
 * - 統一管理所有看板的 undo 功能
 * - 一處修改，所有看板都受益
 * - 確保 undo 行為一致
 *
 * 📋 這個管理員負責什麼？
 * 1. 🗑️ 管理軟刪除和復原邏輯
 * 2. 🎨 控制 Toast 通知顯示
 * 3. ⏰ 處理自動清理計時
 * 4. 🔌 提供統一的刪除函數給子組件
 */

import { provide } from 'vue'
import { useUndo } from '@/composables/useUndo'
import { useCardOperations } from '@/composables/useCardOperations'
import { useBoardStore } from '@/stores/boardStore'
import { DELETE_CARD_KEY } from '@/constants/injectionKeys'
import { logger } from '@/utils/logger'
import type { CardUI } from '@/types'

/**
 * 看板 Undo 系統的統一管理
 */
export function useBoardUndo() {
  // 取得必要的 composables
  const undoState = useUndo()
  const boardStore = useBoardStore()
  const { handleCardDelete } = useCardOperations()

  /**
   * 🔄 整合 undo 系統的卡片刪除函數
   * 處理軟刪除並顯示復原 Toast
   */
  const deleteCardWithUndo = async (card: CardUI) => {
    logger.debug('[BOARD-UNDO] 開始處理卡片刪除:', {
      cardTitle: card.title,
      cardId: card.id
    })

    try {
      // 使用 useCardOperations 處理刪除邏輯
      const deleteInfo = await handleCardDelete(card)

      if (deleteInfo) {
        // 使用 undo 狀態處理軟刪除
        undoState.softDeleteCard(
          deleteInfo.card,
          deleteInfo.listId,
          deleteInfo.position
        )
        logger.debug('[BOARD-UNDO] 卡片已軟刪除，可在 10 秒內復原')
      } else {
        logger.error('[BOARD-UNDO] 無法獲取刪除信息')
      }
    } catch (error) {
      logger.error('[BOARD-UNDO] 卡片刪除失敗:', error)
      throw error
    }
  }

  /**
   * 🔄 復原最近刪除的卡片
   */
  const undoLastDelete = () => {
    if (!undoState.toastState.itemId) {
      logger.warn('[BOARD-UNDO] 沒有可復原的項目')
      return
    }

    const deletedItem = undoState.undoDelete(undoState.toastState.itemId)

    if (deletedItem && deletedItem.type === 'card') {
      // 復原卡片到原本的列表和位置
      boardStore.restoreCard(
        deletedItem.data as CardUI,
        deletedItem.listId!,
        deletedItem.position!
      )
      logger.debug('[BOARD-UNDO] 卡片已復原')
    }
  }

  /**
   * 🔌 提供給子組件使用的刪除函數
   * 使用型別安全的 InjectionKey
   */
  const provideDeleteCard = () => {
    provide(DELETE_CARD_KEY, deleteCardWithUndo)
  }

  return {
    // Undo 狀態
    undoState,

    // 主要功能
    deleteCardWithUndo,
    undoLastDelete,
    provideDeleteCard,

    // Toast 狀態 (給 UndoToast 組件使用)
    toastState: undoState.toastState
  }
}