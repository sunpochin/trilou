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
 *
 * ======================== 🧰 工具箱的故事 ========================
 *
 * 🧒 十歲小朋友解釋：為什麼要做這個 useBoardUndo？
 *
 * 🏠 想像你有兩個房間（手機版房間、電腦版房間）：
 *
 * 之前的問題：
 * - 手機房間有一把槌子、一把螺絲起子
 * - 電腦房間也有一把槌子、一把螺絲起子
 * - 兩個房間的工具做一樣的事（刪除卡片、復原卡片）
 * - 如果槌子壞了，要修理兩把槌子
 * - 如果想換更好的螺絲起子，要換兩把
 *
 * 現在的解決方案 - 共用工具箱：
 * - 做了一個神奇的工具箱（useBoardUndo）
 * - 兩個房間都可以從工具箱拿工具
 * - 槌子壞了？只要修理工具箱裡的那一把
 * - 想要更好的螺絲起子？只要換工具箱裡的就好
 *
 * 工具箱裡有什麼？
 * - 🗑️ 軟刪除槌子：先把東西藏起來（不是真的丟掉）
 * - 🔄 復原螺絲起子：把藏起來的東西拿回來
 * - ⏰ 計時炸彈：10秒後真的把東西丟掉
 * - 🎨 通知喇叭：告訴你「東西已經刪除，還可以復原喔！」
 *
 * 為什麼這樣比較好？
 * - 兩個房間用同樣的工具，行為一致
 * - 修理或升級工具時，只要改一個地方
 * - 新房間（未來可能的平板版）也能用同樣的工具箱
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