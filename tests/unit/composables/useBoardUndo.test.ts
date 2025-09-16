/**
 * 🧪 useBoardUndo Composable 單元測試
 *
 * 測試看板復原系統的統一管理，包含：
 * - 卡片刪除與復原整合
 * - 與 boardStore 的互動
 * - provide/inject 機制
 * - 錯誤處理
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createApp } from 'vue'
import { useBoardUndo } from '@/composables/useBoardUndo'
import { DELETE_CARD_KEY } from '@/constants/injectionKeys'
import type { CardUI } from '@/types'

// Mock dependencies
vi.mock('@/composables/useUndo', () => ({
  useUndo: vi.fn(() => ({
    softDeleteCard: vi.fn(),
    undoDelete: vi.fn(),
    toastState: {
      visible: false,
      message: '',
      itemId: null
    }
  }))
}))

vi.mock('@/composables/useCardOperations', () => ({
  useCardOperations: vi.fn(() => ({
    handleCardDelete: vi.fn()
  }))
}))

vi.mock('@/stores/boardStore', () => ({
  useBoardStore: vi.fn(() => ({
    board: {
      lists: [
        {
          id: 'list-1',
          title: '測試列表',
          cards: []
        }
      ]
    }
  }))
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('useBoardUndo Composable', () => {
  let boardUndoState: ReturnType<typeof useBoardUndo>
  let mockUseUndo: any
  let mockUseCardOperations: any
  let mockBoardStore: any

  // 測試用的卡片資料
  const mockCard: CardUI = {
    id: 'card-1',
    title: '測試卡片',
    listId: 'list-1',
    position: 0,
    description: '測試描述'
  }

  beforeEach(async () => {
    // 重置所有 mock
    vi.clearAllMocks()

    // 取得 mock 實例
    const { useUndo } = await import('@/composables/useUndo')
    const { useCardOperations } = await import('@/composables/useCardOperations')
    const { useBoardStore } = await import('@/stores/boardStore')

    mockUseUndo = vi.mocked(useUndo)()
    mockUseCardOperations = vi.mocked(useCardOperations)()
    mockBoardStore = vi.mocked(useBoardStore)()

    // 創建新的 useBoardUndo 實例
    boardUndoState = useBoardUndo()
  })

  describe('卡片刪除功能', () => {
    it('應該成功刪除卡片並顯示復原 Toast', async () => {
      // Arrange
      const deleteInfo = {
        card: mockCard,
        listId: 'list-1',
        position: 0
      }
      mockUseCardOperations.handleCardDelete.mockResolvedValue(deleteInfo)

      // Act
      await boardUndoState.deleteCardWithUndo(mockCard)

      // Assert
      expect(mockUseCardOperations.handleCardDelete).toHaveBeenCalledWith(mockCard)
      expect(mockUseUndo.softDeleteCard).toHaveBeenCalledWith(
        deleteInfo.card,
        deleteInfo.listId,
        deleteInfo.position
      )
    })

    it('應該處理刪除失敗的情況', async () => {
      // Arrange
      mockUseCardOperations.handleCardDelete.mockResolvedValue(null)
      const { logger } = await import('@/utils/logger')

      // Act
      await boardUndoState.deleteCardWithUndo(mockCard)

      // Assert
      expect(logger.error).toHaveBeenCalledWith('[BOARD-UNDO] 無法獲取刪除信息')
      expect(mockUseUndo.softDeleteCard).not.toHaveBeenCalled()
    })

    it('應該處理卡片刪除異常', async () => {
      // Arrange
      const error = new Error('刪除失敗')
      mockUseCardOperations.handleCardDelete.mockRejectedValue(error)
      const { logger } = await import('@/utils/logger')

      // Act & Assert
      await expect(boardUndoState.deleteCardWithUndo(mockCard)).rejects.toThrow('刪除失敗')
      expect(logger.error).toHaveBeenCalledWith('[BOARD-UNDO] 卡片刪除失敗:', error)
    })
  })

  describe('復原功能', () => {
    beforeEach(() => {
      // 設定 toast 狀態有可復原的項目
      mockUseUndo.toastState.itemId = 'card-1'
    })

    it('應該成功復原卡片到原始位置', () => {
      // Arrange
      const deletedItem = {
        type: 'card' as const,
        data: mockCard,
        restoreInfo: {
          listId: 'list-1',
          position: 0
        }
      }
      mockUseUndo.undoDelete.mockReturnValue(deletedItem)

      // Act
      boardUndoState.undoLastDelete()

      // Assert
      expect(mockUseUndo.undoDelete).toHaveBeenCalledWith('card-1')
      expect(mockBoardStore.board.lists[0].cards).toContain(mockCard)
    })

    it('應該處理目標列表不存在的情況', async () => {
      // Arrange
      const deletedItem = {
        type: 'card' as const,
        data: mockCard,
        restoreInfo: {
          listId: 'non-existent-list',
          position: 0
        }
      }
      mockUseUndo.undoDelete.mockReturnValue(deletedItem)
      const { logger } = await import('@/utils/logger')

      // Act
      boardUndoState.undoLastDelete()

      // Assert
      expect(logger.error).toHaveBeenCalledWith('[BOARD-UNDO] 找不到目標列表:', 'non-existent-list')
    })

    it('應該處理沒有可復原項目的情況', async () => {
      // Arrange
      mockUseUndo.toastState.itemId = null
      const { logger } = await import('@/utils/logger')

      // Act
      boardUndoState.undoLastDelete()

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('[BOARD-UNDO] 沒有可復原的項目')
      expect(mockUseUndo.undoDelete).not.toHaveBeenCalled()
    })

    it('應該處理復原失敗的情況', () => {
      // Arrange
      mockUseUndo.undoDelete.mockReturnValue(null)

      // Act
      boardUndoState.undoLastDelete()

      // Assert
      expect(mockUseUndo.undoDelete).toHaveBeenCalledWith('card-1')
      expect(mockBoardStore.board.lists[0].cards).not.toContain(mockCard)
    })

    it('應該正確處理復原位置超出陣列長度的情況', () => {
      // Arrange
      const existingCards = [
        { id: 'existing-1', title: '現有卡片 1' },
        { id: 'existing-2', title: '現有卡片 2' }
      ]
      mockBoardStore.board.lists[0].cards = [...existingCards]

      const deletedItem = {
        type: 'card' as const,
        data: mockCard,
        restoreInfo: {
          listId: 'list-1',
          position: 10 // 超出陣列長度
        }
      }
      mockUseUndo.undoDelete.mockReturnValue(deletedItem)

      // Act
      boardUndoState.undoLastDelete()

      // Assert
      // 卡片應該被加到陣列最後面
      expect(mockBoardStore.board.lists[0].cards).toHaveLength(3)
      expect(mockBoardStore.board.lists[0].cards[2]).toBe(mockCard)
    })
  })

  describe('Provide/Inject 機制', () => {
    it('應該正確提供刪除函數給子組件', () => {
      // Arrange
      const app = createApp({})
      let providedFunction: any

      // Mock provide function
      const mockProvide = vi.fn((key, value) => {
        if (key === DELETE_CARD_KEY) {
          providedFunction = value
        }
      })

      // 暫時替換 Vue 的 provide
      vi.doMock('vue', () => ({
        provide: mockProvide
      }))

      // Act
      boardUndoState.provideDeleteCard()

      // Assert
      expect(mockProvide).toHaveBeenCalledWith(DELETE_CARD_KEY, boardUndoState.deleteCardWithUndo)
    })
  })

  describe('狀態暴露', () => {
    it('應該正確暴露 undo 狀態', () => {
      // Assert
      expect(boardUndoState.undoState).toBe(mockUseUndo)
      expect(boardUndoState.toastState).toBe(mockUseUndo.toastState)
    })

    it('應該暴露所有必要的方法', () => {
      // Assert
      expect(typeof boardUndoState.deleteCardWithUndo).toBe('function')
      expect(typeof boardUndoState.undoLastDelete).toBe('function')
      expect(typeof boardUndoState.provideDeleteCard).toBe('function')
    })
  })

  describe('整合測試', () => {
    it('應該完整執行刪除和復原流程', async () => {
      // Arrange
      const deleteInfo = {
        card: mockCard,
        listId: 'list-1',
        position: 0
      }
      mockUseCardOperations.handleCardDelete.mockResolvedValue(deleteInfo)
      mockUseUndo.toastState.itemId = 'card-1'

      const deletedItem = {
        type: 'card' as const,
        data: mockCard,
        restoreInfo: {
          listId: 'list-1',
          position: 0
        }
      }
      mockUseUndo.undoDelete.mockReturnValue(deletedItem)

      // Act - 先刪除
      await boardUndoState.deleteCardWithUndo(mockCard)

      // Act - 再復原
      boardUndoState.undoLastDelete()

      // Assert
      expect(mockUseCardOperations.handleCardDelete).toHaveBeenCalledWith(mockCard)
      expect(mockUseUndo.softDeleteCard).toHaveBeenCalledWith(
        deleteInfo.card,
        deleteInfo.listId,
        deleteInfo.position
      )
      expect(mockUseUndo.undoDelete).toHaveBeenCalledWith('card-1')
      expect(mockBoardStore.board.lists[0].cards).toContain(mockCard)
    })
  })
})

/**
 * 🧒 十歲解釋：為什麼要測試 useBoardUndo？
 *
 * 想像 useBoardUndo 是一個「超級管家」：
 *
 * 1. **管家的工作測試** = 確保刪除和復原功能正常
 *    - 能正確把東西丟到垃圾桶
 *    - 能正確從垃圾桶拿回來
 *    - 垃圾桶滿了會正確處理
 *
 * 2. **管家的溝通測試** = 確保與其他部門合作順利
 *    - 能跟倉庫（boardStore）正確溝通
 *    - 能跟清潔工（useCardOperations）配合
 *    - 能跟通知系統（Toast）連接
 *
 * 3. **管家的工具箱測試** = 確保 provide/inject 正常
 *    - 能正確把工具借給需要的房間
 *    - 工具都是最新版本的
 *    - 借出的工具功能正常
 *
 * 4. **緊急情況測試** = 確保異常處理正確
 *    - 房間不存在時怎麼辦
 *    - 東西找不到時怎麼辦
 *    - 工具壞了時怎麼辦
 *
 * 5. **整套服務測試** = 確保完整流程順暢
 *    - 從刪除到復原的完整過程
 *    - 各個步驟都按照順序執行
 *    - 結果符合預期
 *
 * 這些測試就像是管家的「考試」，確保他在各種情況下
 * 都能正確服務整個看板系統！
 */