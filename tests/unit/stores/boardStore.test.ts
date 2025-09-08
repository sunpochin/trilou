/**
 * 🧪 BoardStore 完整單元測試
 * 
 * 📝 測試策略：
 * - State 初始化測試
 * - Getters 計算屬性測試
 * - Actions 方法測試（包含樂觀更新與回滾）
 * - API 呼叫與錯誤處理
 * - Mock Repository 層依賴
 * - 邊界情況與並行操作
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'
import type { CardUI, ListUI } from '@/types'

// Mock Repository 模組
vi.mock('@/repositories/CardRepository', () => ({
  cardRepository: {
    getAllCards: vi.fn(),
    createCard: vi.fn(),
    deleteCard: vi.fn(),
    batchUpdateCards: vi.fn()
  }
}))

vi.mock('@/repositories/ListRepository', () => ({
  listRepository: {
    getAllLists: vi.fn(),
    updateListTitle: vi.fn(),
    batchUpdateListPositions: vi.fn()
  }
}))

// 引入 Mock 的 Repository
import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'

describe('BoardStore', () => {
  let store: ReturnType<typeof useBoardStore>
  
  beforeEach(() => {
    // 為每個測試建立新的 Pinia 實例
    setActivePinia(createPinia())
    store = useBoardStore()
    
    // 清除所有 Mock
    vi.clearAllMocks()
    
    // Mock $fetch 全域函數
    global.$fetch = vi.fn()
    
    // Mock console 方法避免測試輸出
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('State 初始化', () => {
    it('應該正確初始化預設狀態', () => {
      expect(store.board).toEqual({
        id: 'board-1',
        title: 'My Board',
        lists: []
      })
      expect(store.isLoading).toBe(false)
      expect(store.openMenuId).toBe(null)
      expect(store.pendingAiCards).toBe(0)
    })
  })

  describe('Getters 計算屬性', () => {
    describe('nextCardId', () => {
      it('當沒有卡片時應該返回 1', () => {
        expect(store.nextCardId).toBe(1)
      })

      it('應該返回最大卡片 ID + 1', () => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'card-5', title: '卡片5', listId: 'list-1', position: 0 },
              { id: 'card-3', title: '卡片3', listId: 'list-1', position: 1 }
            ]
          },
          {
            id: 'list-2',
            title: '列表2',
            position: 1,
            cards: [
              { id: 'card-10', title: '卡片10', listId: 'list-2', position: 0 }
            ]
          }
        ]
        
        expect(store.nextCardId).toBe(11)
      })

      it('應該忽略非標準格式的卡片 ID', () => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'temp-card-123', title: '暫時卡片', listId: 'list-1', position: 0 },
              { id: 'card-7', title: '卡片7', listId: 'list-1', position: 1 },
              { id: 'custom-id', title: '自訂ID', listId: 'list-1', position: 2 }
            ]
          }
        ]
        
        expect(store.nextCardId).toBe(8)
      })
    })

    describe('nextListId', () => {
      it('當沒有列表時應該返回 1', () => {
        expect(store.nextListId).toBe(1)
      })

      it('應該返回最大列表 ID + 1', () => {
        store.board.lists = [
          { id: 'list-3', title: '列表3', position: 0, cards: [] },
          { id: 'list-8', title: '列表8', position: 1, cards: [] },
          { id: 'list-2', title: '列表2', position: 2, cards: [] }
        ]
        
        expect(store.nextListId).toBe(9)
      })

      it('應該忽略非標準格式的列表 ID', () => {
        store.board.lists = [
          { id: 'temp-list-123', title: '暫時列表', position: 0, cards: [] },
          { id: 'list-5', title: '列表5', position: 1, cards: [] }
        ]
        
        expect(store.nextListId).toBe(6)
      })
    })
  })

  describe('Actions 動作方法', () => {
    describe('fetchBoard - 獲取看板資料', () => {
      it('應該成功獲取並組合列表和卡片資料', async () => {
        const mockLists = [
          { id: 'list-1', title: '待辦', position: 0 },
          { id: 'list-2', title: '進行中', position: 1 }
        ]
        
        const mockCards = [
          { id: 'card-1', title: '任務1', listId: 'list-1', position: 0 },
          { id: 'card-2', title: '任務2', listId: 'list-1', position: 1 },
          { id: 'card-3', title: '任務3', listId: 'list-2', position: 0 }
        ]
        
        vi.mocked(listRepository.getAllLists).mockResolvedValue(mockLists)
        vi.mocked(cardRepository.getAllCards).mockResolvedValue(mockCards)
        
        await store.fetchBoard()
        
        expect(store.isLoading).toBe(false)
        expect(store.board.lists).toHaveLength(2)
        
        // 驗證列表1包含正確的卡片
        expect(store.board.lists[0].title).toBe('待辦')
        expect(store.board.lists[0].cards).toHaveLength(2)
        expect(store.board.lists[0].cards[0].title).toBe('任務1')
        
        // 驗證列表2包含正確的卡片
        expect(store.board.lists[1].title).toBe('進行中')
        expect(store.board.lists[1].cards).toHaveLength(1)
        expect(store.board.lists[1].cards[0].title).toBe('任務3')
      })

      it('應該按 position 排序列表和卡片', async () => {
        const mockLists = [
          { id: 'list-2', title: '列表2', position: 2 },
          { id: 'list-1', title: '列表1', position: 0 },
          { id: 'list-3', title: '列表3', position: 1 }
        ]
        
        const mockCards = [
          { id: 'card-3', title: '卡片3', listId: 'list-1', position: 2 },
          { id: 'card-1', title: '卡片1', listId: 'list-1', position: 0 },
          { id: 'card-2', title: '卡片2', listId: 'list-1', position: 1 }
        ]
        
        vi.mocked(listRepository.getAllLists).mockResolvedValue(mockLists)
        vi.mocked(cardRepository.getAllCards).mockResolvedValue(mockCards)
        
        await store.fetchBoard()
        
        // 驗證列表按 position 排序
        expect(store.board.lists[0].title).toBe('列表1')
        expect(store.board.lists[1].title).toBe('列表3')
        expect(store.board.lists[2].title).toBe('列表2')
        
        // 驗證卡片按 position 排序
        const list1Cards = store.board.lists[0].cards
        expect(list1Cards[0].title).toBe('卡片1')
        expect(list1Cards[1].title).toBe('卡片2')
        expect(list1Cards[2].title).toBe('卡片3')
      })

      it('應該處理空列表（沒有卡片）', async () => {
        const mockLists = [
          { id: 'list-1', title: '空列表', position: 0 }
        ]
        
        vi.mocked(listRepository.getAllLists).mockResolvedValue(mockLists)
        vi.mocked(cardRepository.getAllCards).mockResolvedValue([])
        
        await store.fetchBoard()
        
        expect(store.board.lists[0].cards).toEqual([])
      })

      it('應該處理 API 錯誤並設定空看板', async () => {
        vi.mocked(listRepository.getAllLists).mockRejectedValue(new Error('Network error'))
        
        await store.fetchBoard()
        
        expect(store.board.lists).toEqual([])
        expect(store.isLoading).toBe(false)
      })

      it('應該正確設定 loading 狀態', async () => {
        vi.mocked(listRepository.getAllLists).mockResolvedValue([])
        vi.mocked(cardRepository.getAllCards).mockResolvedValue([])
        
        const promise = store.fetchBoard()
        
        // 初始應該設定為 loading
        expect(store.isLoading).toBe(true)
        
        await promise
        
        // 完成後應該關閉 loading
        expect(store.isLoading).toBe(false)
      })
    })

    describe('addList - 新增列表（樂觀更新）', () => {
      it('應該使用樂觀更新立即新增列表', async () => {
        global.$fetch = vi.fn().mockResolvedValue({
          id: 'list-real-1',
          title: '新列表',
          position: 0
        })
        
        const promise = store.addList('新列表')
        
        // 驗證樂觀更新（立即新增暫時列表）
        expect(store.board.lists).toHaveLength(1)
        expect(store.board.lists[0].title).toBe('新列表')
        expect(store.board.lists[0].id).toMatch(/^temp-list-/)
        
        await promise
        
        // 驗證替換為真實列表
        expect(store.board.lists[0].id).toBe('list-real-1')
      })

      it('應該在 API 失敗時回滾樂觀更新', async () => {
        global.$fetch = vi.fn().mockRejectedValue(new Error('Server error'))
        
        await expect(store.addList('失敗的列表')).rejects.toThrow()
        
        // 驗證回滾（列表應該被移除）
        expect(store.board.lists).toHaveLength(0)
      })

      it('應該修剪列表標題的空白', async () => {
        global.$fetch = vi.fn().mockResolvedValue({
          id: 'list-1',
          title: '修剪後的標題',
          position: 0
        })
        
        await store.addList('  修剪後的標題  ')
        
        expect(global.$fetch).toHaveBeenCalledWith('/api/lists', {
          method: 'POST',
          body: { title: '修剪後的標題' }
        })
      })
    })

    describe('removeList - 刪除列表（樂觀更新）', () => {
      beforeEach(() => {
        store.board.lists = [
          { id: 'list-1', title: '列表1', position: 0, cards: [] },
          { id: 'list-2', title: '列表2', position: 1, cards: [] },
          { id: 'list-3', title: '列表3', position: 2, cards: [] }
        ]
      })

      it('應該使用樂觀更新立即移除列表', async () => {
        global.$fetch = vi.fn().mockResolvedValue(undefined)
        
        const promise = store.removeList('list-2')
        
        // 驗證樂觀更新（立即移除）
        expect(store.board.lists).toHaveLength(2)
        expect(store.board.lists.find(l => l.id === 'list-2')).toBeUndefined()
        
        await promise
        
        // 驗證 API 呼叫
        expect(global.$fetch).toHaveBeenCalledWith('/api/lists/list-2', {
          method: 'DELETE'
        })
      })

      it('應該在 API 失敗時回滾並恢復列表到原始位置', async () => {
        global.$fetch = vi.fn().mockRejectedValue(new Error('Delete failed'))
        
        await expect(store.removeList('list-2')).rejects.toThrow()
        
        // 驗證回滾（列表應該被恢復）
        expect(store.board.lists).toHaveLength(3)
        expect(store.board.lists[1].id).toBe('list-2')
        expect(store.board.lists[1].title).toBe('列表2')
      })

      it('應該處理不存在的列表 ID', async () => {
        await store.removeList('non-existent')
        
        // 不應該呼叫 API
        expect(global.$fetch).not.toHaveBeenCalled()
        expect(store.board.lists).toHaveLength(3)
      })
    })

    describe('addCard - 新增卡片（樂觀更新）', () => {
      beforeEach(() => {
        store.board.lists = [
          { id: 'list-1', title: '列表1', position: 0, cards: [] }
        ]
      })

      it('應該使用樂觀更新立即新增卡片', async () => {
        const mockCard: CardUI = {
          id: 'card-real-1',
          title: '新卡片',
          description: '描述',
          listId: 'list-1',
          position: 0
        }
        
        vi.mocked(cardRepository.createCard).mockResolvedValue(mockCard)
        
        const promise = store.addCard('list-1', '新卡片', 'pending', '描述')
        
        // 驗證樂觀更新
        expect(store.board.lists[0].cards).toHaveLength(1)
        expect(store.board.lists[0].cards[0].title).toBe('新卡片')
        expect(store.board.lists[0].cards[0].status).toBe('pending')
        expect(store.board.lists[0].cards[0].id).toMatch(/^temp-/)
        
        await promise
        
        // 驗證替換為真實卡片
        expect(store.board.lists[0].cards[0].id).toBe('card-real-1')
      })

      it('應該在 API 失敗時回滾樂觀更新', async () => {
        vi.mocked(cardRepository.createCard).mockRejectedValue(new Error('Create failed'))
        
        await expect(store.addCard('list-1', '失敗的卡片')).rejects.toThrow()
        
        // 驗證回滾
        expect(store.board.lists[0].cards).toHaveLength(0)
      })

      it('應該拒絕新增到不存在的列表', async () => {
        await expect(store.addCard('non-existent', '卡片')).rejects.toThrow('找不到指定的列表')
        
        expect(cardRepository.createCard).not.toHaveBeenCalled()
      })

      it('應該正確處理選擇性參數', async () => {
        const mockCard: CardUI = {
          id: 'card-1',
          title: '簡單卡片',
          listId: 'list-1',
          position: 0
        }
        
        vi.mocked(cardRepository.createCard).mockResolvedValue(mockCard)
        
        await store.addCard('list-1', '簡單卡片')
        
        expect(cardRepository.createCard).toHaveBeenCalledWith(
          '簡單卡片',
          'list-1',
          undefined,
          undefined,
          undefined  // priority 參數現在是第 5 個參數
        )
      })
    })

    describe('removeCard - 刪除卡片', () => {
      beforeEach(() => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'card-1', title: '卡片1', listId: 'list-1', position: 0 },
              { id: 'card-2', title: '卡片2', listId: 'list-1', position: 1 }
            ]
          }
        ]
      })

      it('應該成功刪除卡片', async () => {
        global.$fetch = vi.fn().mockResolvedValue(undefined)
        
        await store.removeCard('list-1', 'card-1')
        
        expect(global.$fetch).toHaveBeenCalledWith('/api/cards/card-1', {
          method: 'DELETE'
        })
        
        expect(store.board.lists[0].cards).toHaveLength(1)
        expect(store.board.lists[0].cards[0].id).toBe('card-2')
      })

      it('應該處理刪除錯誤', async () => {
        global.$fetch = vi.fn().mockRejectedValue(new Error('Delete failed'))
        
        await store.removeCard('list-1', 'card-1')
        
        // 卡片應該仍然存在（沒有樂觀更新）
        expect(store.board.lists[0].cards).toHaveLength(2)
      })
    })

    describe('moveCardAndReorder - 移動卡片並重新排序', () => {
      beforeEach(() => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'card-1', title: '卡片1', listId: 'list-1', position: 0 },
              { id: 'card-2', title: '卡片2', listId: 'list-1', position: 1 }
            ]
          },
          {
            id: 'list-2',
            title: '列表2',
            position: 1,
            cards: [
              { id: 'card-3', title: '卡片3', listId: 'list-2', position: 0 }
            ]
          }
        ]
      })

      it('應該重新整理受影響列表的卡片位置', async () => {
        vi.mocked(cardRepository.batchUpdateCards).mockResolvedValue(undefined)
        
        // 模擬拖放：將 card-3 移到 list-1
        store.board.lists[0].cards.push(
          { id: 'card-3', title: '卡片3', listId: 'list-1', position: 2 }
        )
        store.board.lists[1].cards = []
        
        await store.moveCardAndReorder(['list-1', 'list-2'])
        
        // 驗證批次更新呼叫
        expect(cardRepository.batchUpdateCards).toHaveBeenCalledWith([
          { id: 'card-1', listId: 'list-1', position: 0 },
          { id: 'card-2', listId: 'list-1', position: 1 },
          { id: 'card-3', listId: 'list-1', position: 2 }
        ])
      })

      it('應該處理不存在的列表 ID', async () => {
        vi.mocked(cardRepository.batchUpdateCards).mockResolvedValue(undefined)
        
        await store.moveCardAndReorder(['list-1', 'non-existent'])
        
        // 應該只更新存在的列表
        expect(cardRepository.batchUpdateCards).toHaveBeenCalledWith([
          { id: 'card-1', listId: 'list-1', position: 0 },
          { id: 'card-2', listId: 'list-1', position: 1 }
        ])
      })

      it('應該處理 API 錯誤', async () => {
        vi.mocked(cardRepository.batchUpdateCards).mockRejectedValue(new Error('Update failed'))
        
        await expect(store.moveCardAndReorder(['list-1'])).rejects.toThrow('Update failed')
      })

      it('應該處理空列表陣列', async () => {
        await store.moveCardAndReorder([])
        
        expect(cardRepository.batchUpdateCards).toHaveBeenCalledWith([])
      })
    })

    describe('saveListPositions - 儲存列表位置', () => {
      beforeEach(() => {
        store.board.lists = [
          { id: 'list-1', title: '列表1', position: 2, cards: [] },
          { id: 'list-2', title: '列表2', position: 0, cards: [] },
          { id: 'list-3', title: '列表3', position: 1, cards: [] }
        ]
      })

      it('應該保存並同步列表位置', async () => {
        vi.mocked(listRepository.batchUpdateListPositions).mockResolvedValue(undefined)
        
        await store.saveListPositions()
        
        expect(listRepository.batchUpdateListPositions).toHaveBeenCalledWith([
          { id: 'list-1', position: 0 },
          { id: 'list-2', position: 1 },
          { id: 'list-3', position: 2 }
        ])
        
        // 驗證本地同步
        expect(store.board.lists[0].position).toBe(0)
        expect(store.board.lists[1].position).toBe(1)
        expect(store.board.lists[2].position).toBe(2)
      })

      it('應該處理 API 錯誤', async () => {
        vi.mocked(listRepository.batchUpdateListPositions).mockRejectedValue(new Error('Save failed'))
        
        await expect(store.saveListPositions()).rejects.toThrow('Save failed')
      })
    })

    describe('updateCardTitle - 更新卡片標題', () => {
      beforeEach(() => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'card-1', title: '舊標題', listId: 'list-1', position: 0 }
            ]
          },
          {
            id: 'list-2',
            title: '列表2',
            position: 1,
            cards: [
              { id: 'card-2', title: '卡片2', listId: 'list-2', position: 0 }
            ]
          }
        ]
      })

      it('應該更新卡片標題', () => {
        store.updateCardTitle('card-1', '新標題')
        
        expect(store.board.lists[0].cards[0].title).toBe('新標題')
      })

      it('應該找到並更新不同列表中的卡片', () => {
        store.updateCardTitle('card-2', '更新的卡片2')
        
        expect(store.board.lists[1].cards[0].title).toBe('更新的卡片2')
      })

      it('應該處理不存在的卡片', () => {
        store.updateCardTitle('non-existent', '新標題')
        
        // 不應該有任何變化
        expect(store.board.lists[0].cards[0].title).toBe('舊標題')
      })
    })

    describe('updateCardDescription - 更新卡片描述', () => {
      beforeEach(() => {
        store.board.lists = [
          {
            id: 'list-1',
            title: '列表1',
            position: 0,
            cards: [
              { id: 'card-1', title: '卡片', description: '舊描述', listId: 'list-1', position: 0 }
            ]
          }
        ]
      })

      it('應該更新卡片描述', () => {
        store.updateCardDescription('card-1', '新描述')
        
        expect(store.board.lists[0].cards[0].description).toBe('新描述')
      })

      it('應該處理不存在的卡片', () => {
        store.updateCardDescription('non-existent', '新描述')
        
        expect(store.board.lists[0].cards[0].description).toBe('舊描述')
      })
    })

    describe('updateListTitle - 更新列表標題', () => {
      beforeEach(() => {
        store.board.lists = [
          { id: 'list-1', title: '舊標題', position: 0, cards: [] }
        ]
      })

      it('應該成功更新列表標題', async () => {
        vi.mocked(listRepository.updateListTitle).mockResolvedValue(undefined)
        
        await store.updateListTitle('list-1', '新標題')
        
        expect(store.board.lists[0].title).toBe('新標題')
        expect(listRepository.updateListTitle).toHaveBeenCalledWith('list-1', '新標題')
      })

      it('應該在 API 失敗時回滾', async () => {
        vi.mocked(listRepository.updateListTitle).mockRejectedValue(new Error('Update failed'))
        
        await expect(store.updateListTitle('list-1', '新標題')).rejects.toThrow()
        
        // 驗證回滾
        expect(store.board.lists[0].title).toBe('舊標題')
      })

      it('應該忽略空白標題', async () => {
        await store.updateListTitle('list-1', '   ')
        
        expect(listRepository.updateListTitle).not.toHaveBeenCalled()
        expect(store.board.lists[0].title).toBe('舊標題')
      })

      it('應該處理不存在的列表', async () => {
        await store.updateListTitle('non-existent', '新標題')
        
        expect(listRepository.updateListTitle).not.toHaveBeenCalled()
      })
    })

    describe('選單管理', () => {
      describe('setOpenMenu', () => {
        it('應該設定開啟的選單 ID', () => {
          store.setOpenMenu('list-1')
          expect(store.openMenuId).toBe('list-1')
        })

        it('應該可以關閉所有選單', () => {
          store.openMenuId = 'list-1'
          store.setOpenMenu(null)
          expect(store.openMenuId).toBe(null)
        })
      })

      describe('toggleMenu', () => {
        it('應該開啟關閉的選單', () => {
          store.toggleMenu('list-1')
          expect(store.openMenuId).toBe('list-1')
        })

        it('應該關閉已開啟的選單', () => {
          store.openMenuId = 'list-1'
          store.toggleMenu('list-1')
          expect(store.openMenuId).toBe(null)
        })

        it('應該切換到不同的選單', () => {
          store.openMenuId = 'list-1'
          store.toggleMenu('list-2')
          expect(store.openMenuId).toBe('list-2')
        })
      })

      describe('closeAllMenus', () => {
        it('應該關閉所有選單', () => {
          store.openMenuId = 'list-1'
          store.closeAllMenus()
          expect(store.openMenuId).toBe(null)
        })
      })
    })

    describe('AI 卡片計數管理', () => {
      describe('incrementPendingAiCards', () => {
        it('應該增加待處理的 AI 卡片數量', () => {
          store.incrementPendingAiCards()
          expect(store.pendingAiCards).toBe(1)
          
          store.incrementPendingAiCards(3)
          expect(store.pendingAiCards).toBe(4)
        })

        it('應該支援預設參數', () => {
          store.incrementPendingAiCards()
          expect(store.pendingAiCards).toBe(1)
        })
      })

      describe('decrementPendingAiCards', () => {
        it('應該減少待處理的 AI 卡片數量', () => {
          store.pendingAiCards = 5
          
          store.decrementPendingAiCards()
          expect(store.pendingAiCards).toBe(4)
          
          store.decrementPendingAiCards(2)
          expect(store.pendingAiCards).toBe(2)
        })

        it('不應該讓計數變成負數', () => {
          store.pendingAiCards = 1
          
          store.decrementPendingAiCards(5)
          expect(store.pendingAiCards).toBe(0)
        })

        it('應該支援預設參數', () => {
          store.pendingAiCards = 3
          store.decrementPendingAiCards()
          expect(store.pendingAiCards).toBe(2)
        })
      })

      describe('resetPendingAiCards', () => {
        it('應該重置 AI 卡片計數', () => {
          store.pendingAiCards = 10
          
          store.resetPendingAiCards()
          expect(store.pendingAiCards).toBe(0)
        })
      })
    })
  })

  describe('邊界情況與錯誤處理', () => {
    it('應該處理並行的樂觀更新', async () => {
      global.$fetch = vi.fn()
        .mockResolvedValueOnce({ id: 'list-1', title: '列表1', position: 0 })
        .mockResolvedValueOnce({ id: 'list-2', title: '列表2', position: 1 })
      
      // 同時新增兩個列表
      const promises = [
        store.addList('列表1'),
        store.addList('列表2')
      ]
      
      // 應該立即看到兩個暫時列表
      expect(store.board.lists).toHaveLength(2)
      expect(store.board.lists[0].id).toMatch(/^temp-list-/)
      expect(store.board.lists[1].id).toMatch(/^temp-list-/)
      
      await Promise.all(promises)
      
      // 應該都被替換為真實列表
      expect(store.board.lists[0].id).toBe('list-1')
      expect(store.board.lists[1].id).toBe('list-2')
    })

    it('應該處理深層嵌套的資料更新', () => {
      store.board.lists = [
        {
          id: 'list-1',
          title: '列表1',
          position: 0,
          cards: [
            {
              id: 'card-1',
              title: '卡片1',
              description: '描述',
              listId: 'list-1',
              position: 0,
              tags: ['tag1', 'tag2']
            }
          ]
        }
      ]
      
      // 更新深層屬性
      store.updateCardDescription('card-1', '新的描述')
      
      expect(store.board.lists[0].cards[0].description).toBe('新的描述')
      // 其他屬性不應該受影響
      expect(store.board.lists[0].cards[0].tags).toEqual(['tag1', 'tag2'])
    })

    it('應該處理大量資料的效能', async () => {
      // 建立大量測試資料
      const mockLists = Array.from({ length: 100 }, (_, i) => ({
        id: `list-${i}`,
        title: `列表${i}`,
        position: i
      }))
      
      const mockCards = Array.from({ length: 1000 }, (_, i) => ({
        id: `card-${i}`,
        title: `卡片${i}`,
        listId: `list-${i % 100}`,
        position: Math.floor(i / 100)
      }))
      
      vi.mocked(listRepository.getAllLists).mockResolvedValue(mockLists)
      vi.mocked(cardRepository.getAllCards).mockResolvedValue(mockCards)
      
      const startTime = performance.now()
      await store.fetchBoard()
      const endTime = performance.now()
      
      // 驗證資料正確載入
      expect(store.board.lists).toHaveLength(100)
      expect(store.board.lists[0].cards).toHaveLength(10)
      
      // 效能應該在合理範圍內（< 1秒）
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('應該處理部分失敗的並行操作', async () => {
      global.$fetch = vi.fn()
        .mockResolvedValueOnce({ id: 'list-1', title: '列表1', position: 0 })
        .mockRejectedValueOnce(new Error('Server error'))
      
      const promises = [
        store.addList('列表1'),
        store.addList('列表2')
      ]
      
      // 第一個應該成功，第二個應該失敗
      const results = await Promise.allSettled(promises)
      
      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      
      // 只有成功的列表應該存在
      expect(store.board.lists).toHaveLength(1)
      expect(store.board.lists[0].id).toBe('list-1')
    })

    it('應該處理 Repository 返回 null 或 undefined', async () => {
      vi.mocked(listRepository.getAllLists).mockResolvedValue(null as any)
      vi.mocked(cardRepository.getAllCards).mockResolvedValue(undefined as any)
      
      await store.fetchBoard()
      
      // 應該設定為空陣列而不是崩潰
      expect(store.board.lists).toEqual([])
    })
  })

  describe('整合場景測試', () => {
    it('應該處理完整的看板操作流程', async () => {
      // 1. 載入初始資料
      vi.mocked(listRepository.getAllLists).mockResolvedValue([
        { id: 'list-1', title: '待辦', position: 0 }
      ])
      vi.mocked(cardRepository.getAllCards).mockResolvedValue([])
      
      await store.fetchBoard()
      expect(store.board.lists).toHaveLength(1)
      
      // 2. 新增卡片
      vi.mocked(cardRepository.createCard).mockResolvedValue({
        id: 'card-1',
        title: '任務1',
        listId: 'list-1',
        position: 0
      })
      
      await store.addCard('list-1', '任務1')
      expect(store.board.lists[0].cards).toHaveLength(1)
      
      // 3. 新增第二個列表
      global.$fetch = vi.fn().mockResolvedValue({
        id: 'list-2',
        title: '進行中',
        position: 1
      })
      
      await store.addList('進行中')
      expect(store.board.lists).toHaveLength(2)
      
      // 4. 移動卡片到新列表
      store.board.lists[0].cards = []
      store.board.lists[1].cards = [{
        id: 'card-1',
        title: '任務1',
        listId: 'list-2',
        position: 0
      }]
      
      vi.mocked(cardRepository.batchUpdateCards).mockResolvedValue(undefined)
      await store.moveCardAndReorder(['list-1', 'list-2'])
      
      // 5. 更新列表標題
      vi.mocked(listRepository.updateListTitle).mockResolvedValue(undefined)
      await store.updateListTitle('list-2', '已完成')
      
      expect(store.board.lists[1].title).toBe('已完成')
    })

    it('應該處理複雜的拖放操作', async () => {
      // 設定初始狀態：3個列表，每個有2張卡片
      store.board.lists = [
        {
          id: 'list-1',
          title: '列表1',
          position: 0,
          cards: [
            { id: 'card-1', title: '卡片1', listId: 'list-1', position: 0 },
            { id: 'card-2', title: '卡片2', listId: 'list-1', position: 1 }
          ]
        },
        {
          id: 'list-2',
          title: '列表2',
          position: 1,
          cards: [
            { id: 'card-3', title: '卡片3', listId: 'list-2', position: 0 },
            { id: 'card-4', title: '卡片4', listId: 'list-2', position: 1 }
          ]
        },
        {
          id: 'list-3',
          title: '列表3',
          position: 2,
          cards: [
            { id: 'card-5', title: '卡片5', listId: 'list-3', position: 0 },
            { id: 'card-6', title: '卡片6', listId: 'list-3', position: 1 }
          ]
        }
      ]
      
      // 模擬複雜拖放：
      // - card-2 從 list-1 移到 list-3 的開頭
      // - card-4 從 list-2 移到 list-1 的結尾
      // - card-5 從 list-3 移到 list-2 的中間
      
      store.board.lists[0].cards = [
        { id: 'card-1', title: '卡片1', listId: 'list-1', position: 0 },
        { id: 'card-4', title: '卡片4', listId: 'list-1', position: 1 }
      ]
      
      store.board.lists[1].cards = [
        { id: 'card-3', title: '卡片3', listId: 'list-2', position: 0 },
        { id: 'card-5', title: '卡片5', listId: 'list-2', position: 1 }
      ]
      
      store.board.lists[2].cards = [
        { id: 'card-2', title: '卡片2', listId: 'list-3', position: 0 },
        { id: 'card-6', title: '卡片6', listId: 'list-3', position: 1 }
      ]
      
      vi.mocked(cardRepository.batchUpdateCards).mockResolvedValue(undefined)
      
      await store.moveCardAndReorder(['list-1', 'list-2', 'list-3'])
      
      // 驗證批次更新被呼叫且包含所有卡片的新位置
      expect(cardRepository.batchUpdateCards).toHaveBeenCalledWith([
        { id: 'card-1', listId: 'list-1', position: 0 },
        { id: 'card-4', listId: 'list-1', position: 1 },
        { id: 'card-3', listId: 'list-2', position: 0 },
        { id: 'card-5', listId: 'list-2', position: 1 },
        { id: 'card-2', listId: 'list-3', position: 0 },
        { id: 'card-6', listId: 'list-3', position: 1 }
      ])
    })
  })
})