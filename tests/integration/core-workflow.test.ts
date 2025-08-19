/**
 * 🎯 核心工作流程整合測試
 * 
 * 簡化版整合測試，專注於已驗證的核心功能：
 * - useCardActions 與實際業務邏輯的整合
 * - 錯誤處理流程
 * - 效能測試
 * 
 * 避免複雜的 Pinia 設定，專注於業務邏輯驗證
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock 確認對話框
const mockShowConfirm = vi.fn()
vi.mock('@/composables/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    showConfirm: mockShowConfirm
  })
}))

// Mock boardStore
const mockBoardStore = {
  board: {
    lists: []
  },
  moveCardAndReorder: vi.fn(),
  updateCardTitle: vi.fn(),
  updateCardDescription: vi.fn()
}

vi.mock('@/stores/boardStore', () => ({
  useBoardStore: () => mockBoardStore
}))

describe('🎯 核心工作流程整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 設定預設的測試資料
    mockBoardStore.board.lists = [
      {
        id: 'list-1',
        title: '待辦事項',
        cards: [
          { id: 'card-1', title: '學習 Vue.js', position: 0 },
          { id: 'card-2', title: '寫測試', position: 1 }
        ]
      },
      {
        id: 'list-2',
        title: '進行中',
        cards: []
      }
    ]
  })

  describe('🗑️ 卡片刪除工作流程', () => {
    it('應該完成完整的樂觀 UI 刪除流程', async () => {
      // 動態載入 useCardActions (避免模組載入順序問題)
      const { useCardActions } = await import('@/composables/useCardActions')
      const { deleteCard } = useCardActions()

      const cardToDelete = mockBoardStore.board.lists[0].cards[0]
      
      // 模擬用戶確認刪除
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockResolvedValue({})

      // 執行刪除
      const result = await deleteCard(cardToDelete)

      // 驗證完整流程
      expect(result).toBe(true)
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          dangerMode: true
        })
      )
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-1', {
        method: 'DELETE'
      })
      expect(mockBoardStore.moveCardAndReorder).toHaveBeenCalledWith(['list-1'])
    })

    it('應該處理用戶取消刪除的情況', async () => {
      const { useCardActions } = await import('@/composables/useCardActions')
      const { deleteCard } = useCardActions()

      const cardToDelete = mockBoardStore.board.lists[0].cards[0]
      const originalCardsCount = mockBoardStore.board.lists[0].cards.length

      // 模擬用戶取消
      mockShowConfirm.mockResolvedValue(false)

      // 執行刪除
      const result = await deleteCard(cardToDelete)

      // 驗證取消邏輯
      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockBoardStore.moveCardAndReorder).not.toHaveBeenCalled()
      expect(mockBoardStore.board.lists[0].cards).toHaveLength(originalCardsCount)
    })

    it('應該在 API 失敗時執行回滾', async () => {
      const { useCardActions } = await import('@/composables/useCardActions')
      const { deleteCard } = useCardActions()

      const cardToDelete = mockBoardStore.board.lists[0].cards[0]
      const originalCard = { ...cardToDelete }
      const originalCardsCount = mockBoardStore.board.lists[0].cards.length

      // 模擬用戶確認但 API 失敗
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockRejectedValue(new Error('網路錯誤'))

      // Spy on alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      // 執行刪除
      const result = await deleteCard(cardToDelete)

      // 驗證錯誤處理和回滾
      expect(result).toBe(false)
      expect(alertSpy).toHaveBeenCalled()
      expect(mockBoardStore.board.lists[0].cards).toHaveLength(originalCardsCount)
      
      // 驗證卡片已回滾
      const restoredCard = mockBoardStore.board.lists[0].cards.find(c => c.id === originalCard.id)
      expect(restoredCard).toBeTruthy()

      alertSpy.mockRestore()
    })
  })

  describe('🔧 卡片編輯工作流程', () => {
    it('應該正確更新卡片標題', async () => {
      const { useCardActions } = await import('@/composables/useCardActions')
      const { updateCardTitle } = useCardActions()

      // 執行標題更新
      updateCardTitle('card-1', '新的標題')

      // 驗證標題已更新（透過 Mock store）
      expect(mockBoardStore.updateCardTitle).toHaveBeenCalledWith('card-1', '新的標題')
    })

    it('應該正確更新卡片描述', async () => {
      const { useCardActions } = await import('@/composables/useCardActions')
      const { updateCardDescription } = useCardActions()

      // 執行描述更新
      updateCardDescription('card-1', '新的描述')

      // 驗證描述已更新
      expect(mockBoardStore.updateCardDescription).toHaveBeenCalledWith('card-1', '新的描述')
    })
  })

  describe('📊 效能和邊界條件測試', () => {
    it('應該處理大量卡片的刪除操作', async () => {
      // 建立大量卡片
      const manyCards = Array.from({ length: 100 }, (_, i) => ({
        id: `card-${i}`,
        title: `卡片 ${i}`,
        position: i
      }))

      mockBoardStore.board.lists[0].cards = manyCards

      const { useCardActions } = await import('@/composables/useCardActions')
      const { deleteCard } = useCardActions()

      // 模擬確認刪除
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockResolvedValue({})

      // 測量刪除時間
      const startTime = Date.now()
      
      await deleteCard(manyCards[0])
      
      const endTime = Date.now()
      const duration = endTime - startTime

      // 即使有大量卡片，刪除操作也應該很快
      expect(duration).toBeLessThan(100) // 小於 100ms
      expect(mockBoardStore.board.lists[0].cards).toHaveLength(99)
    })

    it('應該處理空列表的刪除操作', async () => {
      // 清空列表
      mockBoardStore.board.lists[0].cards = []
      mockBoardStore.board.lists.push({
        id: 'empty-list',
        title: '空列表',
        cards: []
      })

      const { useCardActions } = await import('@/composables/useCardActions')
      const { deleteCard } = useCardActions()

      const fakeCard = { id: 'fake-card', title: '不存在的卡片', position: 0 }

      // 模擬確認刪除
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockResolvedValue({})

      // 嘗試刪除不存在的卡片
      const result = await deleteCard(fakeCard)

      // 應該仍然成功（API 層面）
      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/fake-card', {
        method: 'DELETE'
      })
    })
  })

  describe('🎨 用戶體驗優化', () => {
    it('應該提供一致的錯誤訊息', async () => {
      const { MESSAGES } = await import('@/constants/messages')
      
      // 驗證訊息常數存在且正確
      expect(MESSAGES.card.delete).toBe('刪除卡片')
      expect(MESSAGES.card.deleteConfirm).toContain('{title}')
      expect(MESSAGES.card.moveError).toBeTruthy()
    })

    it('應該正確處理多語言標題替換', async () => {
      const { MESSAGES } = await import('@/constants/messages')
      
      const cardTitle = '測試卡片標題'
      const confirmMessage = MESSAGES.card.deleteConfirm.replace('{title}', cardTitle)
      
      expect(confirmMessage).toContain(cardTitle)
      expect(confirmMessage).not.toContain('{title}')
    })
  })

  describe('🔗 系統整合點', () => {
    it('應該驗證所有依賴項目都正確載入', async () => {
      // 驗證核心模組可以正確載入
      const cardActions = await import('@/composables/useCardActions')
      const messages = await import('@/constants/messages')
      const types = await import('@/types')

      expect(cardActions.useCardActions).toBeTypeOf('function')
      expect(messages.MESSAGES).toBeTypeOf('object')
      expect(messages.MESSAGES.card).toBeTypeOf('object')
    })

    it('應該有正確的型別定義', async () => {
      // 這個測試驗證 TypeScript 型別系統運作正常
      const { useCardActions } = await import('@/composables/useCardActions')
      const actions = useCardActions()

      // 驗證函數存在且為正確型別
      expect(actions.deleteCard).toBeTypeOf('function')
      expect(actions.updateCardTitle).toBeTypeOf('function')
      expect(actions.updateCardDescription).toBeTypeOf('function')
    })
  })
})