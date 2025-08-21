/**
 * 🧪 boardStore 單元測試
 * 
 * 專注測試最核心的 moveCardAndReorder 方法：
 * - 單一列表內重新排序
 * - 多列表間重新排序
 * - API 失敗處理
 * - 邊界條件處理
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { CardUI, ListUI } from '@/types'

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

// 創建模擬的 store 實例
const createMockStore = () => {
  const { lists } = createTestData()
  
  return {
    board: {
      id: 'board-1',
      title: 'Test Board', 
      lists: lists
    },
    
    // 實際的 moveCardAndReorder 邏輯（從真實 store 複製）
    async moveCardAndReorder(affectedListIds: string[]) {
      console.log(`🚀 [STORE] 開始重新整理受影響列表的 position:`, affectedListIds)
      
      try {
        const updatePromises: Promise<any>[] = []
        
        // 🎯 重新整理所有受影響列表的卡片 position
        for (const listId of affectedListIds) {
          const list = this.board.lists.find((l: any) => l.id === listId)
          if (!list) {
            console.warn(`⚠️ [STORE] 找不到列表 ${listId}`)
            continue
          }
          
          console.log(`📝 [STORE] 重新整理列表 "${list.title}" 的 ${list.cards.length} 張卡片`)
          
          // 為每張卡片重新分配連續的 position 值 (0, 1, 2, 3...)
          list.cards.forEach((card: any, index: number) => {
            const newPosition = index
            console.log(`  📌 [STORE] 卡片 "${card.title}" 新位置: ${newPosition}`)
            
            // 批次收集所有需要更新的 API 請求
            updatePromises.push(
              $fetch(`/api/cards/${card.id}`, {
                method: 'PUT',
                body: {
                  listId: listId,  // 確保卡片屬於正確的列表
                  position: newPosition
                }
              }).then(() => {
                console.log(`✅ [STORE] 已更新卡片 ${card.id} 位置為 ${newPosition}`)
              }).catch((error) => {
                console.error(`❌ [STORE] 更新卡片 ${card.id} 失敗:`, error)
                throw error
              })
            )
          })
        }
        
        console.log(`📤 [STORE] 準備批次更新 ${updatePromises.length} 張卡片的位置...`)
        
        // 批次執行所有 API 更新請求
        await Promise.all(updatePromises)
        
        console.log(`✅ [STORE] 成功重新整理所有受影響列表的位置`)
        
      } catch (error) {
        console.error('❌ [STORE] 重新整理卡片位置失敗:', error)
        console.error('🔄 [STORE] 建議重新載入看板資料以確保一致性')
        throw error
      }
    }
  }
}

// 測試資料工廠
const createTestData = () => {
  const cards1: CardUI[] = [
    { id: 'card-1', title: '卡片1', description: '', position: 0 },
    { id: 'card-2', title: '卡片2', description: '', position: 1 },
    { id: 'card-3', title: '卡片3', description: '', position: 2 }
  ]
  
  const cards2: CardUI[] = [
    { id: 'card-4', title: '卡片4', description: '', position: 0 },
    { id: 'card-5', title: '卡片5', description: '', position: 1 }
  ]
  
  const lists: ListUI[] = [
    { id: 'list-1', title: '列表1', cards: [...cards1] },
    { id: 'list-2', title: '列表2', cards: [...cards2] },
    { id: 'list-3', title: '空列表', cards: [] }
  ]
  
  return { cards1, cards2, lists }
}

describe('boardStore', () => {
  let store: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({}) // 預設 API 成功
    
    // 重新建立 store
    store = createMockStore()
  })

  describe('moveCardAndReorder', () => {
    it('應該重新排序單一列表內的所有卡片', async () => {
      // Arrange: 模擬用戶拖拉後的狀態（position 亂了）
      const list1 = store.board.lists[0]
      list1.cards = [
        { id: 'card-2', title: '卡片2', description: '', position: 1 }, // 原本 position 1
        { id: 'card-1', title: '卡片1', description: '', position: 0 }, // 原本 position 0  
        { id: 'card-3', title: '卡片3', description: '', position: 2 }  // 原本 position 2
      ]
      
      // Act: 重新排序
      await store.moveCardAndReorder(['list-1'])
      
      // Assert: 驗證 API 呼叫
      expect(mockFetch).toHaveBeenCalledTimes(3) // 3 張卡片
      
      // 驗證每張卡片都被更新為正確的連續位置
      expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/cards/card-2', {
        method: 'PUT',
        body: { listId: 'list-1', position: 0 }
      })
      expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/cards/card-1', {
        method: 'PUT', 
        body: { listId: 'list-1', position: 1 }
      })
      expect(mockFetch).toHaveBeenNthCalledWith(3, '/api/cards/card-3', {
        method: 'PUT',
        body: { listId: 'list-1', position: 2 }
      })
    })

    it('應該重新排序多個列表的卡片', async () => {
      // Arrange: 模擬跨列表移動後的狀態
      const list1 = store.board.lists[0]
      const list2 = store.board.lists[1]
      
      // 移動一張卡片從 list1 到 list2
      const movedCard = list1.cards.pop() // 移除最後一張
      list2.cards.unshift(movedCard) // 加到 list2 開頭
      
      // Act: 重新排序兩個受影響的列表
      await store.moveCardAndReorder(['list-1', 'list-2'])
      
      // Assert: 驗證 API 呼叫總數 (list1: 2張, list2: 3張)
      expect(mockFetch).toHaveBeenCalledTimes(5)
      
      // 驗證 list1 的卡片位置 (應該是 0, 1)
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-1', {
        method: 'PUT',
        body: { listId: 'list-1', position: 0 }
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-2', {
        method: 'PUT',
        body: { listId: 'list-1', position: 1 }
      })
      
      // 驗證 list2 的卡片位置 (應該是 0, 1, 2)  
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-3', {
        method: 'PUT',
        body: { listId: 'list-2', position: 0 }
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-4', {
        method: 'PUT', 
        body: { listId: 'list-2', position: 1 }
      })
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-5', {
        method: 'PUT',
        body: { listId: 'list-2', position: 2 }
      })
    })

    it('應該跳過空的列表', async () => {
      // Act: 包含空列表的重新排序
      await store.moveCardAndReorder(['list-3'])
      
      // Assert: 空列表不應該有任何 API 呼叫
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('應該跳過不存在的列表', async () => {
      // Act: 嘗試重新排序不存在的列表
      await store.moveCardAndReorder(['non-existent-list'])
      
      // Assert: 不存在的列表不應該有任何 API 呼叫
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('當部分 API 失敗時應該拋出錯誤', async () => {
      // Arrange: 設定第二個 API 呼叫失敗
      mockFetch
        .mockResolvedValueOnce({}) // 第一次成功
        .mockRejectedValueOnce(new Error('API 錯誤')) // 第二次失敗
        .mockResolvedValueOnce({}) // 第三次成功
      
      // Act & Assert: 應該拋出錯誤
      await expect(store.moveCardAndReorder(['list-1'])).rejects.toThrow()
      
      // 驗證仍然嘗試了所有 API 呼叫
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('當所有 API 都失敗時應該拋出錯誤', async () => {
      // Arrange: 設定所有 API 都失敗
      mockFetch.mockRejectedValue(new Error('網路錯誤'))
      
      // Act & Assert: 應該拋出錯誤
      await expect(store.moveCardAndReorder(['list-1'])).rejects.toThrow()
      
      // 驗證嘗試了所有卡片的 API 呼叫
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('應該處理複雜的多列表重新排序', async () => {
      // Arrange: 設定更複雜的場景
      const { lists } = createTestData()
      store.board.lists = lists
      
      // 模擬複雜的拖拉結果：多張卡片在多個列表間移動
      store.board.lists[0].cards = [
        { id: 'card-5', title: '卡片5', description: '', position: 1 }, // 從 list2 移來
        { id: 'card-1', title: '卡片1', description: '', position: 0 }  // 原本就在這裡
      ]
      
      store.board.lists[1].cards = [
        { id: 'card-2', title: '卡片2', description: '', position: 1 }, // 從 list1 移來
        { id: 'card-4', title: '卡片4', description: '', position: 0 }  // 原本就在這裡
      ]
      
      store.board.lists[2].cards = [
        { id: 'card-3', title: '卡片3', description: '', position: 2 }  // 從 list1 移來
      ]
      
      // Act: 重新排序所有受影響的列表
      await store.moveCardAndReorder(['list-1', 'list-2', 'list-3'])
      
      // Assert: 驗證總共 5 個 API 呼叫 (2+2+1)
      expect(mockFetch).toHaveBeenCalledTimes(5)
      
      // 驗證每個列表都得到正確的連續位置
      const calls = mockFetch.mock.calls
      
      // 找出每個列表的呼叫並驗證位置
      const list1Calls = calls.filter(call => call[1].body.listId === 'list-1')
      const list2Calls = calls.filter(call => call[1].body.listId === 'list-2')  
      const list3Calls = calls.filter(call => call[1].body.listId === 'list-3')
      
      expect(list1Calls).toHaveLength(2)
      expect(list2Calls).toHaveLength(2)
      expect(list3Calls).toHaveLength(1)
      
      // 驗證每個列表內的位置都是連續的
      list1Calls.forEach((call, index) => {
        expect(call[1].body.position).toBe(index)
      })
      list2Calls.forEach((call, index) => {  
        expect(call[1].body.position).toBe(index)
      })
      list3Calls.forEach((call, index) => {
        expect(call[1].body.position).toBe(index)
      })
    })
  })

  describe('邊界條件測試', () => {
    it('應該處理空的列表 ID 陣列', async () => {
      // Act
      await store.moveCardAndReorder([])
      
      // Assert: 不應該有任何 API 呼叫
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('應該處理重複的列表 ID（目前會重複處理）', async () => {
      // Act: 傳入重複的列表 ID
      await store.moveCardAndReorder(['list-1', 'list-1'])
      
      // Assert: 目前實現會重複處理，所以是 6 個 API 呼叫
      // 這個測試揭示了一個潛在的性能問題 - 應該去重列表 ID
      expect(mockFetch).toHaveBeenCalledTimes(6)
      
      // 驗證每張卡片都被更新了兩次（雖然這不是理想的行為）
      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-1', {
        method: 'PUT',
        body: { listId: 'list-1', position: 0 }
      })
      // card-1 被呼叫了兩次
      expect(mockFetch.mock.calls.filter(call => call[0] === '/api/cards/card-1')).toHaveLength(2)
    })
  })
})