/**
 * 🧪 CardRepository TDD 測試
 * 
 * 📝 測試策略：
 * - 測試 API 呼叫的正確性
 * - 測試資料格式轉換
 * - 測試錯誤處理機制
 * - Mock 外部依賴 ($fetch)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CardRepository } from '@/repositories/CardRepository'

describe('CardRepository', () => {
  let cardRepository: CardRepository
  
  beforeEach(() => {
    cardRepository = new CardRepository()
    // 確保每個測試開始前都清除 mock
    vi.clearAllMocks()
  })

  describe('getAllCards', () => {
    it('should fetch and transform cards from API', async () => {
      // 🎯 Arrange - 準備 Mock API 回應
      const mockApiCards = [
        {
          id: 'card_1',
          title: '卡片1',
          description: '描述1',
          list_id: 'list_123',
          position: 0
        },
        {
          id: 'card_2',
          title: '卡片2',
          description: '描述2',
          list_id: 'list_456',
          position: 1
        }
      ]
      
      global.$fetch = vi.fn().mockResolvedValue(mockApiCards)
      
      // 🎯 Act - 執行測試目標
      const result = await cardRepository.getAllCards()
      
      // 🎯 Assert - 驗證結果
      expect($fetch).toHaveBeenCalledWith('/api/cards')
      expect(result).toHaveLength(2)
      
      // 驗證格式轉換（蛇形 → 駝峰）
      expect(result[0]).toEqual({
        id: 'card_1',
        title: '卡片1',
        description: '描述1',
        listId: 'list_123',  // list_id → listId
        position: 0
      })
      
      expect(result[1]).toEqual({
        id: 'card_2',
        title: '卡片2',
        description: '描述2',
        listId: 'list_456',
        position: 1
      })
    })

    it('should handle empty API response', async () => {
      global.$fetch = vi.fn().mockResolvedValue([])
      
      const result = await cardRepository.getAllCards()
      
      expect(result).toEqual([])
    })

    it('should throw error when API call fails', async () => {
      // 模擬 API 錯誤
      global.$fetch = vi.fn().mockRejectedValue(new Error('Network error'))
      
      await expect(cardRepository.getAllCards()).rejects.toThrow('獲取卡片失敗')
    })

    it('should handle 401 unauthorized error', async () => {
      const unauthorizedError = new Error('Unauthorized')
      unauthorizedError.statusCode = 401
      
      global.$fetch = vi.fn().mockRejectedValue(unauthorizedError)
      
      await expect(cardRepository.getAllCards()).rejects.toThrow('請先登入')
    })

    it('should handle 403 forbidden error', async () => {
      const forbiddenError = new Error('Forbidden')
      forbiddenError.statusCode = 403
      
      global.$fetch = vi.fn().mockRejectedValue(forbiddenError)
      
      await expect(cardRepository.getAllCards()).rejects.toThrow('沒有權限執行此操作')
    })
  })

  describe('createCard', () => {
    it('should create card with correct API call', async () => {
      // 🎯 Arrange
      const mockApiResponse = {
        id: 'card_123',
        title: '新卡片',
        description: '',
        list_id: 'list_456',
        position: 0
      }
      
      global.$fetch = vi.fn().mockResolvedValue(mockApiResponse)
      
      // 🎯 Act
      const result = await cardRepository.createCard('新卡片', 'list_456')
      
      // 🎯 Assert
      expect($fetch).toHaveBeenCalledWith('/api/cards', {
        method: 'POST',
        body: {
          title: '新卡片',
          list_id: 'list_456'  // 駝峰轉蛇形
        }
      })
      
      expect(result).toEqual({
        id: 'card_123',
        title: '新卡片',
        description: '',
        listId: 'list_456',  // 轉換回駝峰
        position: 0
      })
    })

    it('should handle missing description in API response', async () => {
      const mockApiResponse = {
        id: 'card_123',
        title: '新卡片',
        list_id: 'list_456',
        position: 0
        // 沒有 description
      }
      
      global.$fetch = vi.fn().mockResolvedValue(mockApiResponse)
      
      const result = await cardRepository.createCard('新卡片', 'list_456')
      
      expect(result.description).toBeUndefined()
    })

    it('should throw error when creation fails', async () => {
      global.$fetch = vi.fn().mockRejectedValue(new Error('Server error'))
      
      await expect(
        cardRepository.createCard('新卡片', 'list_456')
      ).rejects.toThrow('新增卡片失敗')
    })

    it('should handle validation errors from API', async () => {
      const validationError = new Error('Validation failed')
      validationError.statusCode = 400
      
      global.$fetch = vi.fn().mockRejectedValue(validationError)
      
      await expect(
        cardRepository.createCard('', 'list_456')
      ).rejects.toThrow('新增卡片失敗')
    })
  })

  describe('deleteCard', () => {
    it('should call DELETE API with correct card ID', async () => {
      // 🎯 Arrange
      global.$fetch = vi.fn().mockResolvedValue(undefined)
      
      // 🎯 Act
      await cardRepository.deleteCard('card_123')
      
      // 🎯 Assert
      expect($fetch).toHaveBeenCalledWith('/api/cards/card_123', {
        method: 'DELETE'
      })
    })

    it('should not return any value on successful deletion', async () => {
      global.$fetch = vi.fn().mockResolvedValue(undefined)
      
      const result = await cardRepository.deleteCard('card_123')
      
      expect(result).toBeUndefined()
    })

    it('should throw error when deletion fails', async () => {
      global.$fetch = vi.fn().mockRejectedValue(new Error('Server error'))
      
      await expect(
        cardRepository.deleteCard('card_123')
      ).rejects.toThrow('刪除卡片失敗')
    })

    it('should handle 404 not found error', async () => {
      const notFoundError = new Error('Not found')
      notFoundError.statusCode = 404
      
      global.$fetch = vi.fn().mockRejectedValue(notFoundError)
      
      await expect(
        cardRepository.deleteCard('nonexistent_card')
      ).rejects.toThrow('刪除卡片失敗')
    })

    it('should handle permission errors', async () => {
      const forbiddenError = new Error('Forbidden')
      forbiddenError.statusCode = 403
      
      global.$fetch = vi.fn().mockRejectedValue(forbiddenError)
      
      await expect(
        cardRepository.deleteCard('card_123')
      ).rejects.toThrow('沒有權限執行此操作')
    })
  })

  describe('transformApiCard (private method testing via public methods)', () => {
    it('should correctly transform snake_case to camelCase', async () => {
      const mockApiCard = {
        id: 'card_test',
        title: '測試卡片',
        description: '測試描述',
        list_id: 'list_test',  // 蛇形命名
        position: 3
      }
      
      global.$fetch = vi.fn().mockResolvedValue(mockApiCard)
      
      const result = await cardRepository.createCard('測試', 'list_test')
      
      // 驗證轉換結果
      expect(result.listId).toBe('list_test')  // 已轉換成駝峰
      expect(result.id).toBe('card_test')
      expect(result.title).toBe('測試卡片')
      expect(result.description).toBe('測試描述')
      expect(result.position).toBe(3)
    })
  })

  describe('transformApiCards (private method testing)', () => {
    it('should transform array of API cards', async () => {
      const mockApiCards = [
        { id: 'card_1', title: '卡片1', list_id: 'list_1', position: 0 },
        { id: 'card_2', title: '卡片2', list_id: 'list_2', position: 1 }
      ]
      
      global.$fetch = vi.fn().mockResolvedValue(mockApiCards)
      
      const result = await cardRepository.getAllCards()
      
      expect(result).toHaveLength(2)
      expect(result[0].listId).toBe('list_1')
      expect(result[1].listId).toBe('list_2')
    })
  })

  describe('handleError (private method testing via error scenarios)', () => {
    it('should log error to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      global.$fetch = vi.fn().mockRejectedValue(new Error('Test error'))
      
      try {
        await cardRepository.getAllCards()
      } catch (error) {
        // 預期會拋出錯誤
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('獲取卡片失敗', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should preserve original error details in console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const originalError = new Error('Original error message')
      originalError.statusCode = 500
      
      global.$fetch = vi.fn().mockRejectedValue(originalError)
      
      try {
        await cardRepository.createCard('test', 'list_1')
      } catch (error) {
        // 預期會拋出錯誤
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('新增卡片失敗', originalError)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle null API response', async () => {
      global.$fetch = vi.fn().mockResolvedValue(null)
      
      const result = await cardRepository.getAllCards()
      
      // transformApiCards 應該能處理 null
      expect(result).toEqual([])
    })

    it('should handle malformed API response', async () => {
      global.$fetch = vi.fn().mockResolvedValue('invalid response')
      
      await expect(cardRepository.getAllCards()).rejects.toThrow()
    })

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Timeout')
      timeoutError.statusCode = 408
      
      global.$fetch = vi.fn().mockRejectedValue(timeoutError)
      
      await expect(cardRepository.getAllCards()).rejects.toThrow('獲取卡片失敗')
    })

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Too many requests')
      rateLimitError.statusCode = 429
      
      global.$fetch = vi.fn().mockRejectedValue(rateLimitError)
      
      await expect(cardRepository.getAllCards()).rejects.toThrow('獲取卡片失敗')
    })
  })

  describe('concurrent API calls', () => {
    it('should handle multiple simultaneous requests', async () => {
      // 模擬並行請求
      const mockResponses = [
        { id: 'card_1', title: 'Card 1', list_id: 'list_1', position: 0 },
        { id: 'card_2', title: 'Card 2', list_id: 'list_2', position: 0 },
        { id: 'card_3', title: 'Card 3', list_id: 'list_3', position: 0 }
      ]
      
      global.$fetch = vi.fn()
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2])
      
      const promises = [
        cardRepository.createCard('Card 1', 'list_1'),
        cardRepository.createCard('Card 2', 'list_2'),
        cardRepository.createCard('Card 3', 'list_3')
      ]
      
      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(3)
      expect(results[0].title).toBe('Card 1')
      expect(results[1].title).toBe('Card 2')
      expect(results[2].title).toBe('Card 3')
      expect($fetch).toHaveBeenCalledTimes(3)
    })
  })
})