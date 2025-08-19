/**
 * 🧪 卡片工作流程整合測試
 * 
 * 📝 測試策略：
 * - 測試完整的卡片生命週期
 * - 測試多個元件間的協作
 * - 測試事件通訊機制
 * - 模擬真實使用場景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EntityFactory } from '@/factories/EntityFactory'
import { CardRepository } from '@/repositories/CardRepository'
import { eventBus } from '@/events/EventBus'
import { mockApiResponses } from '@/tests/fixtures/testData'

describe('Card Workflow Integration', () => {
  let cardRepository: CardRepository
  
  beforeEach(() => {
    cardRepository = new CardRepository()
    eventBus.removeAllListeners()
    vi.clearAllMocks()
  })

  describe('Card Creation Workflow', () => {
    it('should create card through complete workflow', async () => {
      // 🎯 Arrange - 設定 Mock API 回應
      global.$fetch = vi.fn().mockResolvedValue(mockApiResponses.createCard)
      
      // 🎯 Act - 執行完整的建立流程
      // 1. 透過 Repository 建立卡片
      const createdCard = await cardRepository.createCard('新功能開發', 'list_todo')
      
      // 2. 驗證卡片格式
      const validationErrors = EntityFactory.validateCard(createdCard)
      
      // 🎯 Assert - 驗證結果
      expect(validationErrors).toEqual([])
      expect(createdCard).toEqual({
        id: 'card_new',
        title: '新建立的卡片',
        description: '',
        listId: 'list_todo',  // 已轉換成駝峰命名
        position: 5,
        created_at: '2024-01-05T10:00:00Z',
        updated_at: '2024-01-05T10:00:00Z'
      })
      
      expect($fetch).toHaveBeenCalledWith('/api/cards', {
        method: 'POST',
        body: { 
          title: '新功能開發',
          list_id: 'list_todo'  // 傳送時轉換成蛇形命名
        }
      })
    })

    it('should handle creation failure gracefully', async () => {
      // 🎯 Arrange - 模擬 API 錯誤
      const apiError = new Error('Server Error')
      apiError.statusCode = 500
      global.$fetch = vi.fn().mockRejectedValue(apiError)
      
      // 🎯 Act & Assert - 應該正確拋出錯誤
      await expect(
        cardRepository.createCard('測試卡片', 'list_todo')
      ).rejects.toThrow('新增卡片失敗')
    })

    it('should validate card data before creation', () => {
      // 🎯 測試驗證邏輯
      const invalidCardData = {
        title: '',  // 空標題
        listId: '',  // 空列表ID
        position: -1  // 無效位置
      }
      
      const errors = EntityFactory.validateCard(invalidCardData)
      
      expect(errors).toHaveLength(3)
      expect(errors).toContain('卡片標題不能為空')
      expect(errors).toContain('卡片必須屬於一個列表')
      expect(errors).toContain('卡片位置必須是非負數')
    })
  })

  describe('Event-Driven Workflow', () => {
    it('should notify subscribers when card is created', async () => {
      // 🎯 Arrange - 設定事件監聽器
      const notificationCallback = vi.fn()
      const analyticsCallback = vi.fn()
      
      eventBus.on('card:created', notificationCallback)
      eventBus.on('card:created', analyticsCallback)
      
      // 🎯 Act - 發送事件
      const cardData = {
        cardId: 'card_123',
        listId: 'list_todo',
        title: '新卡片'
      }
      
      eventBus.emit('card:created', cardData)
      
      // 🎯 Assert - 驗證所有監聽器都被呼叫
      expect(notificationCallback).toHaveBeenCalledWith(cardData)
      expect(analyticsCallback).toHaveBeenCalledWith(cardData)
    })

    it('should handle error in one listener without affecting others', () => {
      // 🎯 Arrange - 設定正常和錯誤的監聽器
      const workingCallback = vi.fn()
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error')
      })
      const anotherWorkingCallback = vi.fn()
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      eventBus.on('card:created', workingCallback)
      eventBus.on('card:created', errorCallback)
      eventBus.on('card:created', anotherWorkingCallback)
      
      // 🎯 Act - 發送事件
      const cardData = {
        cardId: 'card_123',
        listId: 'list_todo',
        title: '測試卡片'
      }
      
      eventBus.emit('card:created', cardData)
      
      // 🎯 Assert - 所有監聽器都應該被呼叫，錯誤應該被記錄
      expect(workingCallback).toHaveBeenCalledWith(cardData)
      expect(errorCallback).toHaveBeenCalledWith(cardData)
      expect(anotherWorkingCallback).toHaveBeenCalledWith(cardData)
      expect(consoleSpy).toHaveBeenCalledWith(
        '事件處理器錯誤 [card:created]:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Data Transformation Workflow', () => {
    it('should correctly transform data through the entire pipeline', async () => {
      // 🎯 Arrange - 設定 API 回應（蛇形命名）
      const apiResponse = {
        id: 'card_transform_test',
        title: 'API 卡片',
        description: 'API 描述',
        list_id: 'list_api',  // 蛇形命名
        position: 3,
        created_at: '2024-01-01T10:00:00Z',  // 字串格式
        updated_at: '2024-01-01T11:00:00Z'
      }
      
      global.$fetch = vi.fn().mockResolvedValue(apiResponse)
      
      // 🎯 Act - 透過 Repository 獲取資料
      const transformedCard = await cardRepository.createCard('測試', 'list_api')
      
      // 🎯 Assert - 驗證資料轉換
      expect(transformedCard).toEqual({
        id: 'card_transform_test',
        title: 'API 卡片',
        description: 'API 描述',
        listId: 'list_api',  // 轉換成駝峰命名
        position: 3,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      })
      
      // 進一步測試：使用 EntityFactory 建立相似卡片
      const factoryCard = EntityFactory.createCard({
        title: 'Factory 卡片',
        listId: 'list_api'
      })
      
      expect(factoryCard.listId).toBe('list_api')
      expect(factoryCard.title).toBe('Factory 卡片')
      expect(factoryCard.id).toMatch(/^card_\w+_\w+$/)
    })

    it('should handle API data conversion correctly', () => {
      // 🎯 Arrange - 模擬來自 API 的資料
      const apiCardData = {
        id: 'card_api',
        title: '來自 API',
        description: 'API 描述',
        list_id: 'list_api',
        position: 1,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T11:00:00Z'
      }
      
      // 🎯 Act - 使用 EntityFactory 轉換
      const convertedCard = EntityFactory.createCardFromApi(apiCardData)
      
      // 🎯 Assert - 驗證轉換結果
      expect(convertedCard).toEqual({
        id: 'card_api',
        title: '來自 API',
        description: 'API 描述',
        listId: 'list_api',  // 蛇形轉駝峰
        position: 1,
        createdAt: new Date('2024-01-01T10:00:00Z'),  // 字串轉 Date
        updatedAt: new Date('2024-01-01T11:00:00Z')
      })
    })
  })

  describe('Error Handling Workflow', () => {
    it('should handle authentication errors across components', async () => {
      // 🎯 Arrange - 模擬 401 錯誤
      const authError = new Error('Unauthorized')
      authError.statusCode = 401
      global.$fetch = vi.fn().mockRejectedValue(authError)
      
      // 🎯 Act & Assert - Repository 應該正確處理錯誤
      await expect(
        cardRepository.createCard('測試', 'list_todo')
      ).rejects.toThrow('請先登入')
      
      await expect(
        cardRepository.getAllCards()
      ).rejects.toThrow('請先登入')
      
      await expect(
        cardRepository.deleteCard('card_123')
      ).rejects.toThrow('請先登入')
    })

    it('should handle permission errors consistently', async () => {
      // 🎯 Arrange - 模擬 403 錯誤
      const permissionError = new Error('Forbidden')
      permissionError.statusCode = 403
      global.$fetch = vi.fn().mockRejectedValue(permissionError)
      
      // 🎯 Act & Assert - 所有操作都應該回傳相同的權限錯誤
      await expect(
        cardRepository.createCard('測試', 'list_todo')
      ).rejects.toThrow('沒有權限執行此操作')
      
      await expect(
        cardRepository.deleteCard('card_123')
      ).rejects.toThrow('沒有權限執行此操作')
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent operations', async () => {
      // 🎯 Arrange - 設定多個 API 回應
      const responses = [
        { id: 'card_1', title: 'Card 1', list_id: 'list_1', position: 0 },
        { id: 'card_2', title: 'Card 2', list_id: 'list_2', position: 0 },
        { id: 'card_3', title: 'Card 3', list_id: 'list_3', position: 0 }
      ]
      
      global.$fetch = vi.fn()
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2])
      
      // 🎯 Act - 同時執行多個操作
      const promises = [
        cardRepository.createCard('Card 1', 'list_1'),
        cardRepository.createCard('Card 2', 'list_2'),
        cardRepository.createCard('Card 3', 'list_3')
      ]
      
      const results = await Promise.all(promises)
      
      // 🎯 Assert - 所有操作都應該成功
      expect(results).toHaveLength(3)
      expect(results[0].title).toBe('Card 1')
      expect(results[1].title).toBe('Card 2')
      expect(results[2].title).toBe('Card 3')
      expect($fetch).toHaveBeenCalledTimes(3)
    })

    it('should handle large dataset operations efficiently', () => {
      // 🎯 測試大量資料的處理
      const startTime = performance.now()
      
      // 建立 1000 張卡片
      const cards = Array.from({ length: 1000 }, (_, index) => 
        EntityFactory.createCard({
          title: `卡片 ${index}`,
          listId: 'list_performance_test'
        })
      )
      
      // 驗證所有卡片
      const allErrors = cards.flatMap(card => EntityFactory.validateCard(card))
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 🎯 Assert - 操作應該在合理時間內完成且無錯誤
      expect(cards).toHaveLength(1000)
      expect(allErrors).toEqual([])
      expect(duration).toBeLessThan(100) // 應該在 100ms 內完成
      
      // 驗證每張卡片都有唯一 ID
      const ids = cards.map(card => card.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(1000)
    })
  })
})