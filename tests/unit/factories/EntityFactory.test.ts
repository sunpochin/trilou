/**
 * 🧪 EntityFactory TDD 測試
 * 
 * 📝 測試策略：
 * - 測試所有 public 方法
 * - 測試邊緣情況和錯誤處理
 * - 測試 ID 生成的唯一性
 * - 測試資料驗證邏輯
 */

import { describe, it, expect } from 'vitest'
import { EntityFactory } from '@/factories/EntityFactory'

describe('EntityFactory', () => {
  describe('createCard', () => {
    it('should create card with all required fields', () => {
      // 🎯 Arrange
      const params = {
        title: '測試卡片',
        listId: 'list_123'
      }
      
      // 🎯 Act
      const card = EntityFactory.createCard(params)
      
      // 🎯 Assert
      expect(card.id).toMatch(/^card_\w+_\w+$/)  // ID 格式驗證
      expect(card.title).toBe('測試卡片')
      expect(card.listId).toBe('list_123')
      expect(card.description).toBe('')  // 預設值
      expect(card.position).toBe(0)  // 預設值
      expect(card.createdAt).toBeInstanceOf(Date)
      expect(card.updatedAt).toBeInstanceOf(Date)
    })

    it('should trim whitespace from title', () => {
      const card = EntityFactory.createCard({
        title: '  測試卡片  ',
        listId: 'list_123'
      })
      
      expect(card.title).toBe('測試卡片')
    })

    it('should use provided optional values', () => {
      const card = EntityFactory.createCard({
        title: '測試卡片',
        listId: 'list_123',
        description: '測試描述',
        position: 5
      })
      
      expect(card.description).toBe('測試描述')
      expect(card.position).toBe(5)
    })

    it('should generate unique IDs for multiple cards', () => {
      const card1 = EntityFactory.createCard({
        title: '卡片1',
        listId: 'list_123'
      })
      
      const card2 = EntityFactory.createCard({
        title: '卡片2',
        listId: 'list_123'
      })
      
      expect(card1.id).not.toBe(card2.id)
      expect(card1.id).toMatch(/^card_/)
      expect(card2.id).toMatch(/^card_/)
    })

    it('should handle position with nullish coalescing', () => {
      // 測試 position ?? 0 的行為
      const cardWithZero = EntityFactory.createCard({
        title: '測試',
        listId: 'list_123',
        position: 0
      })
      
      const cardWithUndefined = EntityFactory.createCard({
        title: '測試',
        listId: 'list_123'
        // position 是 undefined
      })
      
      expect(cardWithZero.position).toBe(0)
      expect(cardWithUndefined.position).toBe(0)
    })
  })

  describe('createList', () => {
    it('should create list with all required fields', () => {
      const list = EntityFactory.createList({
        title: '測試列表'
      })
      
      expect(list.id).toMatch(/^list_\w+_\w+$/)
      expect(list.title).toBe('測試列表')
      expect(list.position).toBe(0)
      expect(list.cards).toEqual([])  // 空陣列
      expect(list.createdAt).toBeInstanceOf(Date)
      expect(list.updatedAt).toBeInstanceOf(Date)
    })

    it('should trim whitespace from title', () => {
      const list = EntityFactory.createList({
        title: '  測試列表  '
      })
      
      expect(list.title).toBe('測試列表')
    })

    it('should use provided position', () => {
      const list = EntityFactory.createList({
        title: '測試列表',
        position: 3
      })
      
      expect(list.position).toBe(3)
    })
  })

  describe('createBoard', () => {
    it('should create board with all required fields', () => {
      const board = EntityFactory.createBoard({
        title: '測試看板'
      })
      
      expect(board.id).toMatch(/^board_\w+_\w+$/)
      expect(board.title).toBe('測試看板')
      expect(board.description).toBe('')  // 預設值
      expect(board.lists).toEqual([])  // 空陣列
      expect(board.createdAt).toBeInstanceOf(Date)
      expect(board.updatedAt).toBeInstanceOf(Date)
    })

    it('should use provided description', () => {
      const board = EntityFactory.createBoard({
        title: '測試看板',
        description: '這是測試描述'
      })
      
      expect(board.description).toBe('這是測試描述')
    })
  })

  describe('createCardFromApi', () => {
    it('should transform API data to frontend format', () => {
      const apiData = {
        id: 'card_123',
        title: '來自 API 的卡片',
        description: 'API 描述',
        list_id: 'list_456',  // 蛇形命名
        position: 2,
        created_at: '2024-01-01T10:00:00Z',  // 字串格式
        updated_at: '2024-01-02T10:00:00Z'
      }
      
      const card = EntityFactory.createCardFromApi(apiData)
      
      expect(card.id).toBe('card_123')
      expect(card.title).toBe('來自 API 的卡片')
      expect(card.description).toBe('API 描述')
      expect(card.listId).toBe('list_456')  // 轉換成駝峰命名
      expect(card.position).toBe(2)
      expect(card.createdAt).toBeInstanceOf(Date)
      expect(card.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing fields with defaults', () => {
      const apiData = {
        id: 'card_123',
        list_id: 'list_456',
        created_at: '2024-01-01T10:00:00Z'
        // 缺少 title, description, position, updated_at
      }
      
      const card = EntityFactory.createCardFromApi(apiData)
      
      expect(card.title).toBe('')
      expect(card.description).toBe('')
      expect(card.position).toBe(0)
      expect(card.updatedAt).toEqual(card.createdAt)  // 使用 created_at
    })
  })

  describe('createListFromApi', () => {
    it('should transform API data and nested cards', () => {
      const apiData = {
        id: 'list_123',
        title: 'API 列表',
        position: 1,
        cards: [
          { id: 'card_1', title: '卡片1', list_id: 'list_123', created_at: '2024-01-01T10:00:00Z' },
          { id: 'card_2', title: '卡片2', list_id: 'list_123', created_at: '2024-01-01T10:00:00Z' }
        ],
        created_at: '2024-01-01T10:00:00Z'
      }
      
      const list = EntityFactory.createListFromApi(apiData)
      
      expect(list.id).toBe('list_123')
      expect(list.title).toBe('API 列表')
      expect(list.position).toBe(1)
      expect(list.cards).toHaveLength(2)
      expect(list.cards[0].title).toBe('卡片1')
      expect(list.cards[1].title).toBe('卡片2')
    })

    it('should handle empty cards array', () => {
      const apiData = {
        id: 'list_123',
        title: 'API 列表',
        created_at: '2024-01-01T10:00:00Z'
        // 沒有 cards 欄位
      }
      
      const list = EntityFactory.createListFromApi(apiData)
      
      expect(list.cards).toEqual([])
    })
  })

  describe('cloneCard', () => {
    it('should create a copy with new ID and timestamps', async () => {
      const originalCard = EntityFactory.createCard({
        title: '原始卡片',
        listId: 'list_123',
        description: '原始描述',
        position: 1
      })
      
      // 等一點時間確保時間戳記不同
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const clonedCard = EntityFactory.cloneCard(originalCard)
      
      expect(clonedCard.id).not.toBe(originalCard.id)  // 新 ID
      expect(clonedCard.title).toBe(originalCard.title)  // 內容相同
      expect(clonedCard.description).toBe(originalCard.description)
      expect(clonedCard.listId).toBe(originalCard.listId)
      expect(clonedCard.position).toBe(originalCard.position)
      expect(clonedCard.createdAt.getTime()).toBeGreaterThanOrEqual(originalCard.createdAt.getTime())
    })

    it('should override specified fields', () => {
      const originalCard = EntityFactory.createCard({
        title: '原始卡片',
        listId: 'list_123'
      })
      
      const clonedCard = EntityFactory.cloneCard(originalCard, {
        title: '複製卡片',
        listId: 'list_456'
      })
      
      expect(clonedCard.title).toBe('複製卡片')
      expect(clonedCard.listId).toBe('list_456')
      expect(clonedCard.description).toBe(originalCard.description)  // 未覆蓋的保持原樣
    })
  })

  describe('cloneList', () => {
    it('should clone list with all cards', () => {
      const originalList = EntityFactory.createList({ title: '原始列表' })
      
      // 手動加入一些卡片（模擬有卡片的列表）
      const card1 = EntityFactory.createCard({ title: '卡片1', listId: originalList.id })
      const card2 = EntityFactory.createCard({ title: '卡片2', listId: originalList.id })
      originalList.cards = [card1, card2]
      
      const clonedList = EntityFactory.cloneList(originalList)
      
      expect(clonedList.id).not.toBe(originalList.id)
      expect(clonedList.title).toBe('原始列表 (副本)')  // 預設後綴
      expect(clonedList.cards).toHaveLength(2)
      expect(clonedList.cards[0].id).not.toBe(card1.id)  // 卡片也被複製
      expect(clonedList.cards[0].listId).toBe(clonedList.id)  // 卡片指向新列表
      expect(clonedList.cards[0].title).toBe('卡片1')  // 內容相同
    })

    it('should use custom title when provided', () => {
      const originalList = EntityFactory.createList({ title: '原始列表' })
      
      const clonedList = EntityFactory.cloneList(originalList, {
        title: '自訂標題'
      })
      
      expect(clonedList.title).toBe('自訂標題')
    })
  })

  describe('validateCard', () => {
    it('should return empty array for valid card', () => {
      const errors = EntityFactory.validateCard({
        title: '有效卡片',
        listId: 'list_123',
        position: 0
      })
      
      expect(errors).toEqual([])
    })

    it('should detect empty title', () => {
      const errors = EntityFactory.validateCard({
        title: '',
        listId: 'list_123',
        position: 0
      })
      
      expect(errors).toContain('卡片標題不能為空')
    })

    it('should detect whitespace-only title', () => {
      const errors = EntityFactory.validateCard({
        title: '   ',
        listId: 'list_123',
        position: 0
      })
      
      expect(errors).toContain('卡片標題不能為空')
    })

    it('should detect missing listId', () => {
      const errors = EntityFactory.validateCard({
        title: '測試卡片',
        position: 0
        // 沒有 listId
      })
      
      expect(errors).toContain('卡片必須屬於一個列表')
    })

    it('should detect invalid position', () => {
      const errors1 = EntityFactory.validateCard({
        title: '測試卡片',
        listId: 'list_123',
        position: -1  // 負數
      })
      
      const errors2 = EntityFactory.validateCard({
        title: '測試卡片',
        listId: 'list_123',
        position: 'invalid' as any  // 不是數字
      })
      
      expect(errors1).toContain('卡片位置必須是非負數')
      expect(errors2).toContain('卡片位置必須是非負數')
    })

    it('should return multiple errors', () => {
      const errors = EntityFactory.validateCard({
        title: '',
        position: -1
        // 同時缺少 listId
      })
      
      expect(errors).toHaveLength(3)
      expect(errors).toContain('卡片標題不能為空')
      expect(errors).toContain('卡片必須屬於一個列表')
      expect(errors).toContain('卡片位置必須是非負數')
    })
  })

  describe('validateList', () => {
    it('should return empty array for valid list', () => {
      const errors = EntityFactory.validateList({
        title: '有效列表',
        position: 0
      })
      
      expect(errors).toEqual([])
    })

    it('should detect empty title', () => {
      const errors = EntityFactory.validateList({
        title: '',
        position: 0
      })
      
      expect(errors).toContain('列表標題不能為空')
    })

    it('should detect invalid position', () => {
      const errors = EntityFactory.validateList({
        title: '測試列表',
        position: -1
      })
      
      expect(errors).toContain('列表位置必須是非負數')
    })
  })
})