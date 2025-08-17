/**
 * 🧪 EventBus TDD 測試
 * 
 * 📝 測試策略：
 * - 測試事件發送和接收機制
 * - 測試多個監聽器的處理
 * - 測試錯誤隔離
 * - 測試單例模式
 * - 測試記憶體管理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus, eventBus } from '@/events/EventBus'

describe('EventBus', () => {
  let testEventBus: EventBus
  
  beforeEach(() => {
    // 為了測試，建立一個新的 EventBus 實例
    testEventBus = new (EventBus as any)()
    // 清除所有監聽器
    testEventBus.removeAllListeners()
  })
  
  afterEach(() => {
    // 清理測試後的狀態
    testEventBus.removeAllListeners()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBus.getInstance()
      const instance2 = EventBus.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should export the same instance as eventBus', () => {
      const instance = EventBus.getInstance()
      
      expect(eventBus).toBe(instance)
    })
  })

  describe('on() - 訂閱事件', () => {
    it('should register event listener', () => {
      const callback = vi.fn()
      
      testEventBus.on('card:created', callback)
      
      // 驗證監聽器已被註冊
      expect(testEventBus.getListenerCount('card:created')).toBe(1)
    })

    it('should register multiple listeners for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      testEventBus.on('card:created', callback3)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(3)
    })

    it('should register listeners for different events', () => {
      const cardCallback = vi.fn()
      const listCallback = vi.fn()
      
      testEventBus.on('card:created', cardCallback)
      testEventBus.on('list:deleted', listCallback)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(1)
      expect(testEventBus.getListenerCount('list:deleted')).toBe(1)
    })

    it('should handle TypeScript type safety', () => {
      // 這個測試確保 TypeScript 型別檢查正常運作
      const callback = vi.fn((data: { cardId: string, listId: string, title: string }) => {
        expect(data.cardId).toBeDefined()
        expect(data.listId).toBeDefined()
        expect(data.title).toBeDefined()
      })
      
      testEventBus.on('card:created', callback)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試卡片'
      })
      
      expect(callback).toHaveBeenCalledWith({
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試卡片'
      })
    })
  })

  describe('emit() - 發布事件', () => {
    it('should call registered listener with correct data', () => {
      const callback = vi.fn()
      const eventData = {
        cardId: 'card_123',
        listId: 'list_456',
        title: '新卡片'
      }
      
      testEventBus.on('card:created', callback)
      testEventBus.emit('card:created', eventData)
      
      expect(callback).toHaveBeenCalledOnce()
      expect(callback).toHaveBeenCalledWith(eventData)
    })

    it('should call all registered listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      const eventData = { cardId: 'card_123', listId: 'list_456', title: '測試' }
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      testEventBus.on('card:created', callback3)
      
      testEventBus.emit('card:created', eventData)
      
      expect(callback1).toHaveBeenCalledWith(eventData)
      expect(callback2).toHaveBeenCalledWith(eventData)
      expect(callback3).toHaveBeenCalledWith(eventData)
    })

    it('should not call listeners of different events', () => {
      const cardCallback = vi.fn()
      const listCallback = vi.fn()
      
      testEventBus.on('card:created', cardCallback)
      testEventBus.on('list:deleted', listCallback)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      expect(cardCallback).toHaveBeenCalledOnce()
      expect(listCallback).not.toHaveBeenCalled()
    })

    it('should do nothing if no listeners registered', () => {
      // 這應該不會拋出錯誤
      expect(() => {
        testEventBus.emit('card:created', {
          cardId: 'card_123',
          listId: 'list_456',
          title: '測試'
        })
      }).not.toThrow()
    })

    it('should handle listener that throws error', () => {
      const workingCallback = vi.fn()
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error')
      })
      const anotherWorkingCallback = vi.fn()
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      testEventBus.on('card:created', workingCallback)
      testEventBus.on('card:created', errorCallback)
      testEventBus.on('card:created', anotherWorkingCallback)
      
      const eventData = { cardId: 'card_123', listId: 'list_456', title: '測試' }
      
      // 不應該拋出錯誤，其他監聽器應該繼續執行
      expect(() => {
        testEventBus.emit('card:created', eventData)
      }).not.toThrow()
      
      expect(workingCallback).toHaveBeenCalledWith(eventData)
      expect(errorCallback).toHaveBeenCalledWith(eventData)
      expect(anotherWorkingCallback).toHaveBeenCalledWith(eventData)
      expect(consoleSpy).toHaveBeenCalledWith(
        '事件處理器錯誤 [card:created]:',
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })

    it('should create copy of listeners array to prevent modification during emit', () => {
      const callbacks: any[] = []
      
      // 建立一個會在執行時添加新監聽器的回調
      const modifyingCallback = vi.fn(() => {
        const newCallback = vi.fn()
        callbacks.push(newCallback)
        testEventBus.on('card:created', newCallback)
      })
      
      const normalCallback = vi.fn()
      
      testEventBus.on('card:created', modifyingCallback)
      testEventBus.on('card:created', normalCallback)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      // 原始的兩個監聽器應該被呼叫
      expect(modifyingCallback).toHaveBeenCalledOnce()
      expect(normalCallback).toHaveBeenCalledOnce()
      
      // 新添加的監聽器在這次 emit 中不應該被呼叫
      expect(callbacks[0]).not.toHaveBeenCalled()
      
      // 但在下次 emit 時應該被呼叫
      testEventBus.emit('card:created', {
        cardId: 'card_456',
        listId: 'list_789',
        title: '測試2'
      })
      
      expect(callbacks[0]).toHaveBeenCalledOnce()
    })
  })

  describe('off() - 取消訂閱', () => {
    it('should remove specific listener', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(2)
      
      testEventBus.off('card:created', callback1)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(1)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledOnce()
    })

    it('should handle removing non-existent listener', () => {
      const callback = vi.fn()
      
      // 不應該拋出錯誤
      expect(() => {
        testEventBus.off('card:created', callback)
      }).not.toThrow()
    })

    it('should handle removing from non-existent event', () => {
      const callback = vi.fn()
      
      expect(() => {
        testEventBus.off('non:existent' as any, callback)
      }).not.toThrow()
    })

    it('should only remove the exact function reference', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const similarCallback = vi.fn()  // 不同的函數，即使行為相同
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      
      // 嘗試移除一個沒有註冊的類似函數
      testEventBus.off('card:created', similarCallback)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(2)
    })
  })

  describe('once() - 一次性訂閱', () => {
    it('should call listener only once', () => {
      const callback = vi.fn()
      
      testEventBus.once('card:created', callback)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試1'
      })
      
      testEventBus.emit('card:created', {
        cardId: 'card_456',
        listId: 'list_789',
        title: '測試2'
      })
      
      expect(callback).toHaveBeenCalledOnce()
      expect(callback).toHaveBeenCalledWith({
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試1'
      })
    })

    it('should automatically remove listener after execution', () => {
      const callback = vi.fn()
      
      testEventBus.once('card:created', callback)
      expect(testEventBus.getListenerCount('card:created')).toBe(1)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
    })

    it('should work correctly with multiple once listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      testEventBus.once('card:created', callback1)
      testEventBus.once('card:created', callback2)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(2)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      expect(callback1).toHaveBeenCalledOnce()
      expect(callback2).toHaveBeenCalledOnce()
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
    })

    it('should handle error in once listener correctly', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Once listener error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      testEventBus.once('card:created', errorCallback)
      
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      // 即使出錯，監聽器也應該被移除
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('removeAllListeners() - 清除所有監聽器', () => {
    it('should remove all listeners for all events', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      testEventBus.on('list:deleted', callback3)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(2)
      expect(testEventBus.getListenerCount('list:deleted')).toBe(1)
      
      testEventBus.removeAllListeners()
      
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
      expect(testEventBus.getListenerCount('list:deleted')).toBe(0)
      
      // 確認監聽器真的被移除了
      testEventBus.emit('card:created', {
        cardId: 'card_123',
        listId: 'list_456',
        title: '測試'
      })
      
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should handle empty listener map', () => {
      // 應該不會拋出錯誤
      expect(() => {
        testEventBus.removeAllListeners()
      }).not.toThrow()
    })
  })

  describe('getListenerCount() - 取得監聽器數量', () => {
    it('should return count for specific event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      
      expect(testEventBus.getListenerCount('card:created')).toBe(2)
    })

    it('should return 0 for non-existent event', () => {
      expect(testEventBus.getListenerCount('non:existent' as any)).toBe(0)
    })

    it('should return counts for all events when no parameter provided', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      
      testEventBus.on('card:created', callback1)
      testEventBus.on('card:created', callback2)
      testEventBus.on('list:deleted', callback3)
      
      const counts = testEventBus.getListenerCount()
      
      expect(counts).toEqual({
        'card:created': 2,
        'list:deleted': 1
      })
    })

    it('should return empty object when no listeners registered', () => {
      const counts = testEventBus.getListenerCount()
      
      expect(counts).toEqual({})
    })

    it('should update count correctly after adding/removing listeners', () => {
      const callback = vi.fn()
      
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
      
      testEventBus.on('card:created', callback)
      expect(testEventBus.getListenerCount('card:created')).toBe(1)
      
      testEventBus.off('card:created', callback)
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory when adding and removing many listeners', () => {
      const callbacks: any[] = []
      
      // 添加大量監聽器
      for (let i = 0; i < 1000; i++) {
        const callback = vi.fn()
        callbacks.push(callback)
        testEventBus.on('card:created', callback)
      }
      
      expect(testEventBus.getListenerCount('card:created')).toBe(1000)
      
      // 移除所有監聽器
      callbacks.forEach(callback => {
        testEventBus.off('card:created', callback)
      })
      
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
      
      // 驗證沒有記憶體洩漏（監聽器陣列應該被清空或移除）
      const allCounts = testEventBus.getListenerCount()
      expect(allCounts['card:created']).toBeUndefined()
    })

    it('should handle rapid add/remove operations', () => {
      const callback = vi.fn()
      
      // 快速添加和移除
      for (let i = 0; i < 100; i++) {
        testEventBus.on('card:created', callback)
        testEventBus.off('card:created', callback)
      }
      
      expect(testEventBus.getListenerCount('card:created')).toBe(0)
    })
  })

  describe('Real-world Event Scenarios', () => {
    it('should handle card creation workflow', () => {
      const notificationCallback = vi.fn()
      const analyticsCallback = vi.fn()
      const cacheCallback = vi.fn()
      
      // 模擬真實的事件監聽器
      testEventBus.on('card:created', notificationCallback)
      testEventBus.on('card:created', analyticsCallback)
      testEventBus.on('card:created', cacheCallback)
      
      const cardData = {
        cardId: 'card_123',
        listId: 'list_456',
        title: '實作使用者登入'
      }
      
      testEventBus.emit('card:created', cardData)
      
      expect(notificationCallback).toHaveBeenCalledWith(cardData)
      expect(analyticsCallback).toHaveBeenCalledWith(cardData)
      expect(cacheCallback).toHaveBeenCalledWith(cardData)
    })

    it('should handle multiple event types in sequence', () => {
      const callbacks = {
        cardCreated: vi.fn(),
        listDeleted: vi.fn(),
        userLogin: vi.fn(),
        errorOccurred: vi.fn()
      }
      
      testEventBus.on('card:created', callbacks.cardCreated)
      testEventBus.on('list:deleted', callbacks.listDeleted)
      testEventBus.on('user:login', callbacks.userLogin)
      testEventBus.on('error:occurred', callbacks.errorOccurred)
      
      // 模擬事件序列
      testEventBus.emit('user:login', { userId: 'user_123', email: 'test@example.com' })
      testEventBus.emit('card:created', { cardId: 'card_123', listId: 'list_456', title: '新任務' })
      testEventBus.emit('list:deleted', { listId: 'list_789' })
      testEventBus.emit('error:occurred', { error: new Error('Test error'), context: 'test' })
      
      expect(callbacks.userLogin).toHaveBeenCalledOnce()
      expect(callbacks.cardCreated).toHaveBeenCalledOnce()
      expect(callbacks.listDeleted).toHaveBeenCalledOnce()
      expect(callbacks.errorOccurred).toHaveBeenCalledOnce()
    })
  })
})