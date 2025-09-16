/**
 * 🧪 useUndo Composable 單元測試
 *
 * 測試 undo 系統的核心邏輯，包含：
 * - 軟刪除功能
 * - 復原功能
 * - 自動清理機制
 * - Toast 狀態管理
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useUndo } from '@/composables/useUndo'
import type { CardUI } from '@/types'

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

// Mock dynamic imports
vi.mock('@/repositories/CardRepository', () => ({
  cardRepository: {
    deleteCard: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('@/events/EventBus', () => ({
  eventBus: {
    emit: vi.fn()
  }
}))

describe('useUndo Composable', () => {
  let undoState: ReturnType<typeof useUndo>

  // 測試用的卡片資料
  const mockCard: CardUI = {
    id: 'card-1',
    title: '測試卡片',
    listId: 'list-1',
    position: 0,
    description: '測試描述'
  }

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()
    // 重置計時器
    vi.useFakeTimers()
    // 創建新的 undo 實例
    undoState = useUndo()
  })

  afterEach(() => {
    // 清理計時器
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('軟刪除功能', () => {
    it('應該正確執行軟刪除卡片', () => {
      // Act
      undoState.softDeleteCard(mockCard, 'list-1', 2)

      // Assert
      expect(undoState.toastState.visible).toBe(true)
      expect(undoState.toastState.message).toContain(mockCard.title)
      expect(undoState.toastState.itemId).toBe(mockCard.id)
    })

    it('應該保存正確的復原資訊', () => {
      // Act
      undoState.softDeleteCard(mockCard, 'list-1', 2)

      // 模擬復原操作來獲取 deletedItem
      const deletedItem = undoState.undoDelete(mockCard.id)

      // Assert
      expect(deletedItem).toBeDefined()
      expect(deletedItem?.data.id).toBe(mockCard.id)
      expect(deletedItem?.data.title).toBe(mockCard.title)
      expect(deletedItem?.restoreInfo.listId).toBe('list-1')
      expect(deletedItem?.restoreInfo.position).toBe(2)
    })

    it('應該設定自動清理計時器', () => {
      // Arrange
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

      // Act
      undoState.softDeleteCard(mockCard, 'list-1', 0)

      // Assert
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        10000 // 10 秒
      )
    })
  })

  describe('復原功能', () => {
    beforeEach(() => {
      // 先執行軟刪除
      undoState.softDeleteCard(mockCard, 'list-1', 2)
    })

    it('應該成功復原被刪除的項目', () => {
      // Act
      const restoredItem = undoState.undoDelete(mockCard.id)

      // Assert
      expect(restoredItem).toBeDefined()
      expect(restoredItem?.type).toBe('card')
      expect(restoredItem?.data.id).toBe(mockCard.id)
      expect(restoredItem?.restoreInfo.listId).toBe('list-1')
      expect(restoredItem?.restoreInfo.position).toBe(2)
    })

    it('復原後應該清除 Toast 狀態', () => {
      // Act
      undoState.undoDelete(mockCard.id)

      // Assert
      expect(undoState.toastState.visible).toBe(false)
      expect(undoState.toastState.message).toBe('')
      expect(undoState.toastState.itemId).toBeNull()
    })

    it('復原後應該取消自動清理計時器', () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      // Act
      undoState.undoDelete(mockCard.id)

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('應該處理復原不存在的項目', () => {
      // Act
      const result = undoState.undoDelete('non-existent-id')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('永久刪除功能', () => {
    beforeEach(() => {
      // 先執行軟刪除
      undoState.softDeleteCard(mockCard, 'list-1', 2)
    })

    it('應該在10秒後自動永久刪除', async () => {
      // Act - 快進 10 秒
      vi.advanceTimersByTime(10000)

      // 等待異步操作完成
      await vi.runAllTimersAsync()

      // Assert - 項目應該被永久刪除
      const restoredItem = undoState.undoDelete(mockCard.id)
      expect(restoredItem).toBeNull()
    })

    it('永久刪除後應該隱藏 Toast', async () => {
      // Act - 快進 10 秒
      vi.advanceTimersByTime(10000)
      await vi.runAllTimersAsync()

      // Assert
      expect(undoState.toastState.visible).toBe(false)
      expect(undoState.toastState.itemId).toBeNull()
    })

    it('應該呼叫後端 API 刪除卡片', async () => {
      // Arrange
      const { cardRepository } = await import('@/repositories/CardRepository')

      // Act - 快進 10 秒
      vi.advanceTimersByTime(10000)
      await vi.runAllTimersAsync()

      // Assert
      expect(cardRepository.deleteCard).toHaveBeenCalledWith(mockCard.id)
    })
  })

  describe('Toast 管理', () => {
    it('應該正確顯示 Toast', () => {
      // Act
      undoState.showToast('測試訊息', 'item-1')

      // Assert
      expect(undoState.toastState.visible).toBe(true)
      expect(undoState.toastState.message).toBe('測試訊息')
      expect(undoState.toastState.itemId).toBe('item-1')
    })

    it('應該正確隱藏 Toast', () => {
      // Arrange
      undoState.showToast('測試訊息', 'item-1')

      // Act
      undoState.hideToast()

      // Assert
      expect(undoState.toastState.visible).toBe(false)
      expect(undoState.toastState.message).toBe('')
      expect(undoState.toastState.itemId).toBeNull()
    })
  })

  describe('清理功能', () => {
    it('應該清理所有暫存項目和計時器', () => {
      // Arrange
      undoState.softDeleteCard(mockCard, 'list-1', 0)
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      // Act
      undoState.cleanup()

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled()

      // 嘗試復原應該失敗（因為已清理）
      const result = undoState.undoDelete(mockCard.id)
      expect(result).toBeNull()
    })
  })

  describe('邊界條件測試', () => {
    it('應該處理空卡片資料', () => {
      // Arrange
      const emptyCard = {} as CardUI

      // Act & Assert - 不應該拋出錯誤
      expect(() => {
        undoState.softDeleteCard(emptyCard, 'list-1', 0)
      }).not.toThrow()
    })

    it('應該處理重複刪除同一張卡片', () => {
      // Act
      undoState.softDeleteCard(mockCard, 'list-1', 0)
      undoState.softDeleteCard(mockCard, 'list-2', 1)

      // 復原後應該得到最新的資訊
      const restoredItem = undoState.undoDelete(mockCard.id)

      // Assert
      expect(restoredItem?.restoreInfo.listId).toBe('list-2')
      expect(restoredItem?.restoreInfo.position).toBe(1)
    })
  })
})

/**
 * 🧒 十歲解釋：為什麼要寫這些測試？
 *
 * 想像你有一個神奇的垃圾桶（undo 系統）：
 *
 * 1. **軟刪除測試** = 確保東西正確丟進垃圾桶
 *    - 檢查標籤有沒有貼對（Toast 訊息）
 *    - 確認位置記錄正確（之後才能放回原位）
 *
 * 2. **復原測試** = 確保能從垃圾桶拿回東西
 *    - 拿回來的東西要是原來的
 *    - 要記得原本放在哪裡
 *
 * 3. **自動清理測試** = 確保垃圾車會來
 *    - 10秒後垃圾要真的被載走
 *    - 載走後就拿不回來了
 *
 * 4. **邊界測試** = 確保特殊情況不會壞掉
 *    - 空的東西也能丟
 *    - 同樣東西丟兩次不會壞
 *
 * 這些測試就像品管員，確保我們的垃圾桶系統永遠正常運作！
 */