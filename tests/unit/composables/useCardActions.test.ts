/**
 * 🧪 useCardActions Composable 單元測試
 * 
 * 測試卡片操作業務邏輯的各種場景：
 * - 刪除卡片成功流程
 * - 刪除卡片錯誤回滾
 * - 用戶取消刪除
 * - 更新卡片標題和描述
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { CardUI } from '@/types'

// Mock defineStore 全域函數
global.defineStore = vi.fn(() => vi.fn())

// Mock 依賴項目 
vi.mock('@/stores/boardStore')
vi.mock('@/composables/useConfirmDialog')

// 延遲導入，確保 Mock 已設定
const { useCardActions } = await import('@/composables/useCardActions')
const { useBoardStore } = await import('@/stores/boardStore')
const { useConfirmDialog } = await import('@/composables/useConfirmDialog')  
const { MESSAGES } = await import('@/constants/messages')

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

describe('useCardActions', () => {
  // 測試資料
  const mockCard: CardUI = {
    id: 'card-123',
    title: '測試卡片',
    description: '測試描述',
    position: 1
  }

  // 創建測試資料的工廠函數，避免測試間互相影響
  const createMockSourceList = () => ({
    id: 'list-456',
    title: '測試列表',
    cards: [
      { id: 'card-456', title: '其他卡片', position: 0 },
      { ...mockCard }, // 複製卡片物件
      { id: 'card-789', title: '另一張卡片', position: 2 }
    ]
  })

  // Mock 實例
  let mockBoardStore: any
  let mockShowConfirm: Mock
  let mockMoveCardAndReorder: Mock
  let mockUpdateCardTitle: Mock
  let mockUpdateCardDescription: Mock
  let mockSourceList: any

  beforeEach(() => {
    // 重置所有 Mock
    vi.clearAllMocks()

    // 每次測試前重新建立乾淨的測試資料
    mockSourceList = createMockSourceList()

    // Mock boardStore 方法
    mockMoveCardAndReorder = vi.fn()
    mockUpdateCardTitle = vi.fn()
    mockUpdateCardDescription = vi.fn()
    
    mockBoardStore = {
      board: {
        lists: [mockSourceList]
      },
      moveCardAndReorder: mockMoveCardAndReorder,
      updateCardTitle: mockUpdateCardTitle,
      updateCardDescription: mockUpdateCardDescription
    }
    
    // Mock useBoardStore 回傳
    ;(useBoardStore as any).mockReturnValue(mockBoardStore)
    
    // Mock useConfirmDialog
    mockShowConfirm = vi.fn()
    ;(useConfirmDialog as any).mockReturnValue({
      showConfirm: mockShowConfirm
    })
  })

  describe('deleteCard', () => {
    it('應該成功刪除卡片並重新排序', async () => {
      // Arrange: 設定用戶確認刪除
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockResolvedValue({})
      
      // Act: 執行刪除操作
      const { deleteCard } = useCardActions()
      const result = await deleteCard(mockCard)
      
      // Assert: 驗證流程正確
      expect(result).toBe(true)
      
      // 驗證確認對話框被正確呼叫
      expect(mockShowConfirm).toHaveBeenCalledWith({
        title: MESSAGES.card.delete,
        message: MESSAGES.card.deleteConfirm.replace('{title}', mockCard.title),
        confirmText: MESSAGES.dialog.delete,
        cancelText: MESSAGES.dialog.cancel,
        dangerMode: true
      })
      
      // 驗證卡片從列表中移除（樂觀更新）
      expect(mockSourceList.cards).toHaveLength(2)
      expect(mockSourceList.cards.find(c => c.id === mockCard.id)).toBeUndefined()
      
      // 驗證 API 被正確呼叫
      expect(mockFetch).toHaveBeenCalledWith(`/api/cards/${mockCard.id}`, {
        method: 'DELETE'
      })
      
      // 驗證位置重新排序
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith([mockSourceList.id])
    })

    it('當用戶取消時應該返回 false', async () => {
      // Arrange: 設定用戶取消刪除
      mockShowConfirm.mockResolvedValue(false)
      
      // Act: 執行刪除操作
      const { deleteCard } = useCardActions()
      const result = await deleteCard(mockCard)
      
      // Assert: 驗證取消邏輯
      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockMoveCardAndReorder).not.toHaveBeenCalled()
      
      // 驗證列表狀態未改變
      expect(mockSourceList.cards).toHaveLength(3)
      expect(mockSourceList.cards.find(c => c.id === mockCard.id)).toBeDefined()
    })

    it('當 API 失敗時應該回滾狀態', async () => {
      // Arrange: 設定用戶確認但 API 失敗
      mockShowConfirm.mockResolvedValue(true)
      const mockError = new Error('API 錯誤')
      mockFetch.mockRejectedValue(mockError)
      
      // Spy on alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      // 記錄原始狀態
      const originalCardsLength = mockSourceList.cards.length
      const originalCardExists = mockSourceList.cards.find(c => c.id === mockCard.id)
      
      // Act: 執行刪除操作
      const { deleteCard } = useCardActions()
      const result = await deleteCard(mockCard)
      
      // Assert: 驗證錯誤處理和回滾
      expect(result).toBe(false)
      
      // 驗證狀態已回滾
      expect(mockSourceList.cards).toHaveLength(originalCardsLength)
      expect(mockSourceList.cards.find(c => c.id === mockCard.id)).toBeDefined()
      
      // 驗證錯誤訊息顯示
      expect(alertSpy).toHaveBeenCalledWith(MESSAGES.card.moveError)
      
      // 驗證不會呼叫重新排序
      expect(mockMoveCardAndReorder).not.toHaveBeenCalled()
      
      alertSpy.mockRestore()
    })

    it('找不到卡片時應該仍然呼叫 API', async () => {
      // Arrange: 設定用戶確認，但卡片不在任何列表中
      mockShowConfirm.mockResolvedValue(true)
      mockFetch.mockResolvedValue({})
      
      // 移除卡片讓測試找不到
      mockBoardStore.board.lists = []
      
      // Act: 執行刪除操作
      const { deleteCard } = useCardActions()
      const result = await deleteCard(mockCard)
      
      // Assert: 應該仍然成功（API 層面刪除成功）
      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(`/api/cards/${mockCard.id}`, {
        method: 'DELETE'
      })
      
      // 但不會呼叫重新排序（因為找不到 sourceList）
      expect(mockMoveCardAndReorder).not.toHaveBeenCalled()
    })
  })

  describe('updateCardTitle', () => {
    it('應該呼叫 store 的 updateCardTitle', () => {
      // Act
      const { updateCardTitle } = useCardActions()
      updateCardTitle('card-123', '新標題')
      
      // Assert
      expect(mockUpdateCardTitle).toHaveBeenCalledWith('card-123', '新標題')
    })
  })

  describe('updateCardDescription', () => {
    it('應該呼叫 store 的 updateCardDescription', () => {
      // Act
      const { updateCardDescription } = useCardActions()
      updateCardDescription('card-123', '新描述')
      
      // Assert
      expect(mockUpdateCardDescription).toHaveBeenCalledWith('card-123', '新描述')
    })
  })

  describe('錯誤邊界測試', () => {
    it('應該處理 API 回應異常格式', async () => {
      // Arrange
      mockShowConfirm.mockResolvedValue(true)
      const weirdError = { statusCode: 500, message: '伺服器錯誤' }
      mockFetch.mockRejectedValue(weirdError)
      
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      // Act
      const { deleteCard } = useCardActions()
      const result = await deleteCard(mockCard)
      
      // Assert
      expect(result).toBe(false)
      expect(alertSpy).toHaveBeenCalledWith(MESSAGES.card.moveError)
      
      alertSpy.mockRestore()
    })
  })
})