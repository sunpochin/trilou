/**
 * 🧪 moveCardAndReorder 詳細測試
 * 
 * 📝 專門測試卡片跨列表移動時的 position 寫入資料庫功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'

// Mock fetch
global.$fetch = vi.fn()

describe('moveCardAndReorder Position 更新測試', () => {
  let boardStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    boardStore = useBoardStore()
    
    // 設定初始看板資料
    boardStore.board = {
      id: 'board_1',
      title: '測試看板',
      lists: [
        {
          id: 'list_1',
          title: '待辦',
          cards: [
            { id: 'card_1', title: '任務一', position: 0 },
            { id: 'card_2', title: '任務二', position: 1 },
            { id: 'card_3', title: '任務三', position: 2 }
          ]
        },
        {
          id: 'list_2', 
          title: '進行中',
          cards: [
            { id: 'card_4', title: '任務四', position: 0 },
            { id: 'card_5', title: '任務五', position: 1 }
          ]
        },
        {
          id: 'list_3',
          title: '完成',
          cards: []
        }
      ]
    }

    // Mock $fetch 成功回應
    ;(global.$fetch as any).mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('跨列表移動 Position 更新', () => {
    it('應該正確更新所有卡片的 position 和 list_id', async () => {
      // 模擬跨列表移動：card_1 從 list_1 移動到 list_2 的第一個位置
      // 模擬 vue-draggable 已經更新的狀態
      boardStore.board.lists[0].cards.splice(0, 1) // 從 list_1 移除 card_1
      boardStore.board.lists[1].cards.unshift({ // 加到 list_2 第一個位置
        id: 'card_1', 
        title: '任務一', 
        position: 0 
      })

      // 執行 moveCardAndReorder
      await boardStore.moveCardAndReorder(['list_1', 'list_2'])

      // 驗證 list_1 的 API 呼叫
      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_2', {
        method: 'PUT',
        body: {
          list_id: 'list_1',
          position: 0  // 原本 position 1 的卡片現在變成 0
        }
      })

      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_3', {
        method: 'PUT',
        body: {
          list_id: 'list_1', 
          position: 1  // 原本 position 2 的卡片現在變成 1
        }
      })

      // 驗證 list_2 的 API 呼叫
      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_1', {
        method: 'PUT',
        body: {
          list_id: 'list_2',  // 🎯 重點：list_id 應該更新為新的列表
          position: 0  // 新位置
        }
      })

      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_4', {
        method: 'PUT',
        body: {
          list_id: 'list_2',
          position: 1  // 原本 position 0 現在變成 1
        }
      })

      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_5', {
        method: 'PUT',
        body: {
          list_id: 'list_2',
          position: 2  // 原本 position 1 現在變成 2
        }
      })

      // 總共應該呼叫 5 次 API
      expect(global.$fetch).toHaveBeenCalledTimes(5)
    })

    it('應該正確處理移動到空列表', async () => {
      // 模擬移動到空列表 list_3
      const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
      boardStore.board.lists[2].cards.push(movedCard)

      await boardStore.moveCardAndReorder(['list_1', 'list_3'])

      // 驗證移動到空列表的卡片
      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_1', {
        method: 'PUT',
        body: {
          list_id: 'list_3',  // 🎯 重點：應該更新到新列表
          position: 0
        }
      })

      // 驗證原列表的卡片位置重新整理
      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_2', {
        method: 'PUT',
        body: {
          list_id: 'list_1',
          position: 0
        }
      })
    })

    it('應該正確處理批次更新失敗', async () => {
      // Mock 其中一個 API 失敗
      ;(global.$fetch as any).mockImplementation((url: string) => {
        if (url.includes('card_2')) {
          return Promise.reject(new Error('API 錯誤'))
        }
        return Promise.resolve({})
      })

      // 模擬移動操作
      const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
      boardStore.board.lists[1].cards.push(movedCard)

      // 應該拋出錯誤
      await expect(boardStore.moveCardAndReorder(['list_1', 'list_2'])).rejects.toThrow()

      // 確保仍然嘗試了所有 API 呼叫
      expect(global.$fetch).toHaveBeenCalled()
    })

    it('應該正確處理不存在的列表 ID', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await boardStore.moveCardAndReorder(['list_1', 'non_existent_list'])

      // 應該記錄警告
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ [STORE] 找不到列表 non_existent_list')

      // 但仍然處理存在的列表
      expect(global.$fetch).toHaveBeenCalledTimes(3) // list_1 有 3 張卡片

      consoleSpy.mockRestore()
    })

    it('應該正確記錄詳細的 console 資訊', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await boardStore.moveCardAndReorder(['list_1'])

      // 檢查關鍵的 console.log 呼叫
      expect(consoleSpy).toHaveBeenCalledWith('🚀 [STORE] 開始重新整理受影響列表的 position:', ['list_1'])
      expect(consoleSpy).toHaveBeenCalledWith('📝 [STORE] 重新整理列表 "待辦" 的 3 張卡片')
      expect(consoleSpy).toHaveBeenCalledWith('📤 [STORE] 準備批次更新 3 張卡片的位置...')

      consoleSpy.mockRestore()
    })
  })

  describe('同列表內移動 Position 更新', () => {
    it('應該正確更新同列表內所有卡片位置', async () => {
      // 模擬同列表內移動：將第一張卡片移到最後
      const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
      boardStore.board.lists[0].cards.push(movedCard)

      await boardStore.moveCardAndReorder(['list_1'])

      // 驗證所有卡片的新位置
      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_2', {
        method: 'PUT',
        body: {
          list_id: 'list_1',
          position: 0
        }
      })

      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_3', {
        method: 'PUT',
        body: {
          list_id: 'list_1',
          position: 1
        }
      })

      expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card_1', {
        method: 'PUT',
        body: {
          list_id: 'list_1',
          position: 2  // 移到最後
        }
      })
    })
  })

  describe('邊界情況', () => {
    it('應該處理空列表陣列', async () => {
      await boardStore.moveCardAndReorder([])

      // 不應該呼叫任何 API
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('應該處理空卡片列表', async () => {
      // 清空列表
      boardStore.board.lists[0].cards = []

      await boardStore.moveCardAndReorder(['list_1'])

      // 不應該呼叫任何 API
      expect(global.$fetch).not.toHaveBeenCalled()
    })
  })
})