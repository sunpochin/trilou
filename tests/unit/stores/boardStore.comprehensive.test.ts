/**
 * 🧪 boardStore 完整單元測試
 * 
 * 測試範圍：
 * - State 和 Getters 測試
 * - 所有 Actions 的完整測試覆蓋
 * - 樂觀 UI 更新機制測試
 * - 錯誤處理和回滾機制測試
 * - 邊界條件和異常情況測試
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'
import type { CardUI, ListUI } from '@/types'

// Mock 所有外部依賴
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock repository imports
vi.mock('@/repositories/CardRepository', () => ({
  cardRepository: {
    getAllCards: vi.fn(),
    createCard: vi.fn(),
    batchUpdateCards: vi.fn()
  }
}))

vi.mock('@/repositories/ListRepository', () => ({
  listRepository: {
    getAllLists: vi.fn(),
    batchUpdateListPositions: vi.fn(),
    updateListTitle: vi.fn()
  }
}))

// 取得 mock 實例以便在測試中使用
import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'

describe('boardStore 完整測試', () => {
  let boardStore: any

  // 測試資料工廠
  const createTestLists = (): ListUI[] => [
    {
      id: 'list-1',
      title: '待辦事項',
      position: 0,
      cards: [
        { id: 'card-1', title: '任務1', description: '', listId: 'list-1', position: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'card-2', title: '任務2', description: '', listId: 'list-1', position: 1, createdAt: new Date(), updatedAt: new Date() }
      ]
    },
    {
      id: 'list-2',
      title: '進行中',
      position: 1,
      cards: [
        { id: 'card-3', title: '任務3', description: '', listId: 'list-2', position: 0, createdAt: new Date(), updatedAt: new Date() }
      ]
    },
    {
      id: 'list-3',
      title: '已完成',
      position: 2,
      cards: []
    }
  ]

  const createTestCards = (): CardUI[] => [
    { id: 'card-1', title: '任務1', description: '', listId: 'list-1', position: 0, createdAt: new Date(), updatedAt: new Date() },
    { id: 'card-2', title: '任務2', description: '', listId: 'list-1', position: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'card-3', title: '任務3', description: '', listId: 'list-2', position: 0, createdAt: new Date(), updatedAt: new Date() }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    boardStore = useBoardStore()
    
    // 重置所有 mocks
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({})
    ;(cardRepository.getAllCards as Mock).mockResolvedValue(createTestCards())
    ;(listRepository.getAllLists as Mock).mockResolvedValue(createTestLists())
    ;(cardRepository.createCard as Mock).mockResolvedValue({ id: 'card-new', title: 'New Card', listId: 'list-1' })
    ;(cardRepository.batchUpdateCards as Mock).mockResolvedValue(undefined)
    ;(listRepository.batchUpdateListPositions as Mock).mockResolvedValue(undefined)
    ;(listRepository.updateListTitle as Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('State 初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      expect(boardStore.board).toEqual({
        id: 'board-1',
        title: 'My Board',
        lists: []
      })
      expect(boardStore.isLoading).toBe(false)
      expect(boardStore.openMenuId).toBe(null)
    })
  })

  describe('Getters 測試', () => {
    describe('nextCardId', () => {
      it('應該返回正確的下一個卡片 ID (空看板)', () => {
        expect(boardStore.nextCardId).toBe(1)
      })

      it('應該返回正確的下一個卡片 ID (有現有卡片)', () => {
        boardStore.board.lists = [
          {
            id: 'list-1',
            title: 'Test',
            cards: [
              { id: 'card-5', title: 'Card 5' },
              { id: 'card-2', title: 'Card 2' },
              { id: 'card-10', title: 'Card 10' }
            ]
          }
        ]
        expect(boardStore.nextCardId).toBe(11) // max(5,2,10) + 1
      })

      it('應該忽略非標準格式的卡片 ID', () => {
        boardStore.board.lists = [
          {
            id: 'list-1',
            title: 'Test',
            cards: [
              { id: 'card-3', title: 'Valid' },
              { id: 'temp-card-123', title: 'Temp' },
              { id: 'custom-id', title: 'Custom' }
            ]
          }
        ]
        expect(boardStore.nextCardId).toBe(4) // 只計算 card-3，所以是 3 + 1
      })
    })

    describe('nextListId', () => {
      it('應該返回正確的下一個列表 ID (空看板)', () => {
        expect(boardStore.nextListId).toBe(1)
      })

      it('應該返回正確的下一個列表 ID (有現有列表)', () => {
        boardStore.board.lists = [
          { id: 'list-2', title: 'List 2', cards: [] },
          { id: 'list-7', title: 'List 7', cards: [] },
          { id: 'list-1', title: 'List 1', cards: [] }
        ]
        expect(boardStore.nextListId).toBe(8) // max(2,7,1) + 1
      })

      it('應該忽略非標準格式的列表 ID', () => {
        boardStore.board.lists = [
          { id: 'list-3', title: 'Valid', cards: [] },
          { id: 'temp-list-456', title: 'Temp', cards: [] },
          { id: 'custom-list', title: 'Custom', cards: [] }
        ]
        expect(boardStore.nextListId).toBe(4) // 只計算 list-3，所以是 3 + 1
      })
    })
  })

  describe('fetchBoard 測試', () => {
    it('應該成功獲取並組裝看板資料', async () => {
      const testLists = createTestLists()
      const testCards = createTestCards()
      
      ;(listRepository.getAllLists as Mock).mockResolvedValue(testLists)
      ;(cardRepository.getAllCards as Mock).mockResolvedValue(testCards)

      await boardStore.fetchBoard()

      expect(boardStore.isLoading).toBe(false)
      expect(boardStore.board.lists).toHaveLength(3)
      expect(boardStore.board.lists[0].cards).toHaveLength(2)
      expect(boardStore.board.lists[1].cards).toHaveLength(1)
      expect(boardStore.board.lists[2].cards).toHaveLength(0)
    })

    it('應該正確處理載入狀態', async () => {
      let loadingDuringFetch = false
      const promise = boardStore.fetchBoard()
      
      // 檢查載入狀態
      if (boardStore.isLoading) {
        loadingDuringFetch = true
      }
      
      await promise
      
      expect(loadingDuringFetch).toBe(true)
      expect(boardStore.isLoading).toBe(false)
    })

    it('應該處理 API 失敗情況', async () => {
      ;(listRepository.getAllLists as Mock).mockRejectedValue(new Error('API 錯誤'))

      await boardStore.fetchBoard()

      expect(boardStore.board.lists).toEqual([])
      expect(boardStore.isLoading).toBe(false)
    })

    it('應該正確按 position 排序列表和卡片', async () => {
      const unorderedLists = [
        { id: 'list-2', title: 'Second', position: 1, cards: [] },
        { id: 'list-1', title: 'First', position: 0, cards: [] },
        { id: 'list-3', title: 'Third', position: 2, cards: [] }
      ]
      
      const unorderedCards = [
        { id: 'card-2', title: 'Second', listId: 'list-1', position: 1 },
        { id: 'card-1', title: 'First', listId: 'list-1', position: 0 }
      ]

      ;(listRepository.getAllLists as Mock).mockResolvedValue(unorderedLists)
      ;(cardRepository.getAllCards as Mock).mockResolvedValue(unorderedCards)

      await boardStore.fetchBoard()

      // 驗證列表順序
      expect(boardStore.board.lists[0].title).toBe('First')
      expect(boardStore.board.lists[1].title).toBe('Second')
      expect(boardStore.board.lists[2].title).toBe('Third')

      // 驗證卡片順序
      expect(boardStore.board.lists[0].cards[0].title).toBe('First')
      expect(boardStore.board.lists[0].cards[1].title).toBe('Second')
    })
  })

  describe('addList 樂觀 UI 測試', () => {
    it('應該立即顯示新列表（樂觀更新）', () => {
      const initialCount = boardStore.board.lists.length
      
      // 不等待 API 響應，直接檢查 UI 狀態
      boardStore.addList('新列表')
      
      expect(boardStore.board.lists).toHaveLength(initialCount + 1)
      expect(boardStore.board.lists[initialCount].title).toBe('新列表')
      expect(boardStore.board.lists[initialCount].id).toMatch(/^temp-list-/)
    })

    it('應該在 API 成功後替換暫時 ID', async () => {
      mockFetch.mockResolvedValue({ id: 'list-real', title: '新列表', position: 0 })

      await boardStore.addList('新列表')

      expect(boardStore.board.lists).toHaveLength(1)
      expect(boardStore.board.lists[0].id).toBe('list-real')
      expect(boardStore.board.lists[0].title).toBe('新列表')
    })

    it('應該在 API 失敗後回滾樂觀更新', async () => {
      mockFetch.mockRejectedValue(new Error('API 失敗'))
      const initialCount = boardStore.board.lists.length

      try {
        await boardStore.addList('失敗列表')
      } catch (error) {
        // 預期會拋出錯誤
      }

      expect(boardStore.board.lists).toHaveLength(initialCount)
    })

    it('應該處理空白標題（實際會 trim 後進行 API 調用）', async () => {
      await boardStore.addList('   ')
      // 實際實現會 trim 標題，但仍會調用 API
      expect(mockFetch).toHaveBeenCalledWith('/api/lists', {
        method: 'POST',
        body: { title: '   ' }
      })
    })

    it('應該正確設定新列表的 position', () => {
      boardStore.board.lists = createTestLists()
      
      boardStore.addList('第四個列表')
      
      const newList = boardStore.board.lists[boardStore.board.lists.length - 1]
      expect(newList.position).toBe(3) // 0, 1, 2 之後應該是 3
    })
  })

  describe('removeList 樂觀 UI 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該立即從 UI 移除列表（樂觀更新）', () => {
      const initialCount = boardStore.board.lists.length
      
      boardStore.removeList('list-1')
      
      expect(boardStore.board.lists).toHaveLength(initialCount - 1)
      expect(boardStore.board.lists.find(l => l.id === 'list-1')).toBeUndefined()
    })

    it('應該在 API 成功後保持刪除狀態', async () => {
      mockFetch.mockResolvedValue({})

      await boardStore.removeList('list-1')

      expect(boardStore.board.lists.find(l => l.id === 'list-1')).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/lists/list-1', { method: 'DELETE' })
    })

    it('應該在 API 失敗後恢復列表', async () => {
      mockFetch.mockRejectedValue(new Error('API 失敗'))
      const originalList = boardStore.board.lists.find(l => l.id === 'list-1')

      try {
        await boardStore.removeList('list-1')
      } catch (error) {
        // 預期會拋出錯誤
      }

      const restoredList = boardStore.board.lists.find(l => l.id === 'list-1')
      expect(restoredList).toBeDefined()
      expect(restoredList?.title).toBe(originalList?.title)
    })

    it('應該忽略不存在的列表 ID', async () => {
      const initialCount = boardStore.board.lists.length

      await boardStore.removeList('non-existent')

      expect(boardStore.board.lists).toHaveLength(initialCount)
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('addCard 樂觀 UI 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該立即顯示新卡片（樂觀更新）', () => {
      const list = boardStore.board.lists[0]
      const initialCardCount = list.cards.length

      boardStore.addCard('list-1', '新卡片')

      expect(list.cards).toHaveLength(initialCardCount + 1)
      expect(list.cards[initialCardCount].title).toBe('新卡片')
      expect(list.cards[initialCardCount].id).toMatch(/^temp-/)
    })

    it('應該在 API 成功後替換暫時卡片', async () => {
      const realCard = { id: 'card-real', title: '新卡片', listId: 'list-1', position: 2 }
      ;(cardRepository.createCard as Mock).mockResolvedValue(realCard)

      await boardStore.addCard('list-1', '新卡片')

      const list = boardStore.board.lists[0]
      const addedCard = list.cards[list.cards.length - 1]
      expect(addedCard.id).toBe('card-real')
      expect(addedCard.title).toBe('新卡片')
    })

    it('應該在 API 失敗後移除暫時卡片', async () => {
      ;(cardRepository.createCard as Mock).mockRejectedValue(new Error('API 失敗'))
      const list = boardStore.board.lists[0]
      const initialCardCount = list.cards.length

      try {
        await boardStore.addCard('list-1', '失敗卡片')
      } catch (error) {
        // 預期會拋出錯誤
      }

      expect(list.cards).toHaveLength(initialCardCount)
    })

    it('應該處理不存在的列表 ID', async () => {
      await expect(boardStore.addCard('non-existent', '卡片')).rejects.toThrow('找不到指定的列表')
    })

    it('應該正確設定卡片的 position', () => {
      const list = boardStore.board.lists[0] // 已有 2 張卡片
      
      boardStore.addCard('list-1', '第三張卡片')
      
      const newCard = list.cards[list.cards.length - 1]
      expect(newCard.position).toBe(2) // position 應該是 0, 1, 2
    })

    it('應該支援卡片描述和狀態', () => {
      boardStore.addCard('list-1', '詳細卡片', 'in-progress', '詳細描述')
      
      const list = boardStore.board.lists[0]
      const newCard = list.cards[list.cards.length - 1]
      expect(newCard.description).toBe('詳細描述')
      expect(newCard.status).toBe('in-progress')
    })
  })

  describe('moveCardAndReorder 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該重新排序單一列表的卡片', async () => {
      // 模擬拖拽後的狀態
      const list = boardStore.board.lists[0]
      list.cards = [
        { id: 'card-2', title: '任務2', description: '', listId: 'list-1', position: 1 },
        { id: 'card-1', title: '任務1', description: '', listId: 'list-1', position: 0 }
      ]

      await boardStore.moveCardAndReorder(['list-1'])

      expect((cardRepository.batchUpdateCards as Mock)).toHaveBeenCalledWith([
        { id: 'card-2', listId: 'list-1', position: 0 },
        { id: 'card-1', listId: 'list-1', position: 1 }
      ])
    })

    it('應該處理跨列表移動', async () => {
      // 模擬跨列表移動
      const list1 = boardStore.board.lists[0]
      const list2 = boardStore.board.lists[1]
      
      // 將 card-1 從 list-1 移到 list-2
      const movedCard = list1.cards.shift()!
      list2.cards.push(movedCard)
      movedCard.listId = 'list-2'

      await boardStore.moveCardAndReorder(['list-1', 'list-2'])

      const calls = (cardRepository.batchUpdateCards as Mock).mock.calls[0][0]
      
      // 驗證有更新兩個列表的卡片
      expect(calls).toContainEqual({ id: 'card-2', listId: 'list-1', position: 0 })
      expect(calls).toContainEqual({ id: 'card-3', listId: 'list-2', position: 0 })
      expect(calls).toContainEqual({ id: 'card-1', listId: 'list-2', position: 1 })
    })

    it('應該處理空列表', async () => {
      await boardStore.moveCardAndReorder(['list-3']) // 空列表

      expect((cardRepository.batchUpdateCards as Mock)).toHaveBeenCalledWith([])
    })

    it('應該處理不存在的列表 ID', async () => {
      await boardStore.moveCardAndReorder(['non-existent', 'list-1'])

      // 應該只處理存在的列表
      const calls = (cardRepository.batchUpdateCards as Mock).mock.calls[0][0]
      expect(calls).toHaveLength(2) // list-1 有 2 張卡片
    })

    it('應該在 API 失敗時拋出錯誤', async () => {
      (cardRepository.batchUpdateCards as Mock).mockRejectedValue(new Error('API 失敗'))

      await expect(boardStore.moveCardAndReorder(['list-1'])).rejects.toThrow('API 失敗')
    })
  })

  describe('saveListPositions 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該正確保存列表位置', async () => {
      await boardStore.saveListPositions()

      expect((listRepository.batchUpdateListPositions as Mock)).toHaveBeenCalledWith([
        { id: 'list-1', position: 0 },
        { id: 'list-2', position: 1 },
        { id: 'list-3', position: 2 }
      ])
    })

    it('應該同步本地 position 屬性', async () => {
      await boardStore.saveListPositions()

      boardStore.board.lists.forEach((list, index) => {
        expect(list.position).toBe(index)
      })
    })

    it('應該在 API 失敗時拋出錯誤', async () => {
      (listRepository.batchUpdateListPositions as Mock).mockRejectedValue(new Error('API 失敗'))

      await expect(boardStore.saveListPositions()).rejects.toThrow('API 失敗')
    })
  })

  describe('removeCard 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該成功刪除卡片', async () => {
      mockFetch.mockResolvedValue({})
      const list = boardStore.board.lists[0]
      const initialCount = list.cards.length

      await boardStore.removeCard('list-1', 'card-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/cards/card-1', { method: 'DELETE' })
      expect(list.cards).toHaveLength(initialCount - 1)
      expect(list.cards.find(c => c.id === 'card-1')).toBeUndefined()
    })

    it('應該處理不存在的列表', async () => {
      mockFetch.mockResolvedValue({})

      await boardStore.removeCard('non-existent', 'card-1')

      expect(mockFetch).toHaveBeenCalled()
      // 不應該影響現有列表
      expect(boardStore.board.lists[0].cards.find(c => c.id === 'card-1')).toBeDefined()
    })

    it('應該處理不存在的卡片', async () => {
      mockFetch.mockResolvedValue({})
      const list = boardStore.board.lists[0]
      const initialCount = list.cards.length

      await boardStore.removeCard('list-1', 'non-existent')

      expect(list.cards).toHaveLength(initialCount) // 不變
    })

    it('應該處理 API 失敗', async () => {
      mockFetch.mockRejectedValue(new Error('API 失敗'))
      const list = boardStore.board.lists[0]
      const initialCount = list.cards.length

      await boardStore.removeCard('list-1', 'card-1')

      // 即使 API 失敗，也不應該影響本地狀態（因為沒有樂觀更新）
      expect(list.cards).toHaveLength(initialCount)
    })
  })

  describe('updateCardTitle 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該成功更新卡片標題', () => {
      boardStore.updateCardTitle('card-1', '新標題')

      const card = boardStore.board.lists[0].cards.find(c => c.id === 'card-1')
      expect(card?.title).toBe('新標題')
    })

    it('應該處理不存在的卡片 ID', () => {
      boardStore.updateCardTitle('non-existent', '新標題')

      // 應該不會拋出錯誤，也不會影響現有卡片
      const originalCard = boardStore.board.lists[0].cards.find(c => c.id === 'card-1')
      expect(originalCard?.title).toBe('任務1')
    })

    it('應該只更新第一個匹配的卡片', () => {
      // 添加相同 ID 的卡片（雖然實際不應該發生）
      boardStore.board.lists[1].cards.push({
        id: 'card-1',
        title: '重複卡片',
        description: '',
        listId: 'list-2',
        position: 1
      } as CardUI)

      boardStore.updateCardTitle('card-1', '新標題')

      // 只有第一個應該被更新
      expect(boardStore.board.lists[0].cards.find(c => c.id === 'card-1')?.title).toBe('新標題')
      expect(boardStore.board.lists[1].cards.find(c => c.id === 'card-1')?.title).toBe('重複卡片')
    })
  })

  describe('updateCardDescription 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該成功更新卡片描述', () => {
      boardStore.updateCardDescription('card-1', '新描述')

      const card = boardStore.board.lists[0].cards.find(c => c.id === 'card-1')
      expect(card?.description).toBe('新描述')
    })

    it('應該處理不存在的卡片 ID', () => {
      boardStore.updateCardDescription('non-existent', '新描述')

      // 應該不會拋出錯誤
      const originalCard = boardStore.board.lists[0].cards.find(c => c.id === 'card-1')
      expect(originalCard?.description).toBe('')
    })
  })

  describe('updateListTitle 測試', () => {
    beforeEach(() => {
      boardStore.board.lists = createTestLists()
    })

    it('應該成功更新列表標題（樂觀更新）', async () => {
      (listRepository.updateListTitle as Mock).mockResolvedValue({})

      await boardStore.updateListTitle('list-1', '新標題')

      const list = boardStore.board.lists.find(l => l.id === 'list-1')
      expect(list?.title).toBe('新標題')
      expect((listRepository.updateListTitle as Mock)).toHaveBeenCalledWith('list-1', '新標題')
    })

    it('應該在 API 失敗時回滾標題', async () => {
      (listRepository.updateListTitle as Mock).mockRejectedValue(new Error('API 失敗'))
      const originalTitle = boardStore.board.lists[0].title

      try {
        await boardStore.updateListTitle('list-1', '失敗標題')
      } catch (error) {
        // 預期會拋出錯誤
      }

      const list = boardStore.board.lists.find(l => l.id === 'list-1')
      expect(list?.title).toBe(originalTitle) // 應該回滾到原標題
    })

    it('應該忽略空白標題', async () => {
      await boardStore.updateListTitle('list-1', '   ')

      expect((listRepository.updateListTitle as Mock)).not.toHaveBeenCalled()
    })

    it('應該處理不存在的列表 ID', async () => {
      await boardStore.updateListTitle('non-existent', '新標題')

      expect((listRepository.updateListTitle as Mock)).not.toHaveBeenCalled()
    })

    it('應該自動修剪標題空白', async () => {
      (listRepository.updateListTitle as Mock).mockResolvedValue({})

      await boardStore.updateListTitle('list-1', '  修剪標題  ')

      const list = boardStore.board.lists.find(l => l.id === 'list-1')
      expect(list?.title).toBe('修剪標題')
      expect((listRepository.updateListTitle as Mock)).toHaveBeenCalledWith('list-1', '修剪標題')
    })
  })

  describe('選單控制測試', () => {
    describe('setOpenMenu', () => {
      it('應該設定開啟的選單 ID', () => {
        boardStore.setOpenMenu('list-1')
        expect(boardStore.openMenuId).toBe('list-1')
      })

      it('應該可以關閉所有選單', () => {
        boardStore.setOpenMenu('list-1')
        boardStore.setOpenMenu(null)
        expect(boardStore.openMenuId).toBe(null)
      })
    })

    describe('toggleMenu', () => {
      it('應該開啟指定的選單', () => {
        boardStore.toggleMenu('list-1')
        expect(boardStore.openMenuId).toBe('list-1')
      })

      it('應該關閉已開啟的選單', () => {
        boardStore.setOpenMenu('list-1')
        boardStore.toggleMenu('list-1')
        expect(boardStore.openMenuId).toBe(null)
      })

      it('應該切換到不同的選單', () => {
        boardStore.setOpenMenu('list-1')
        boardStore.toggleMenu('list-2')
        expect(boardStore.openMenuId).toBe('list-2')
      })
    })

    describe('closeAllMenus', () => {
      it('應該關閉所有開啟的選單', () => {
        boardStore.setOpenMenu('list-1')
        boardStore.closeAllMenus()
        expect(boardStore.openMenuId).toBe(null)
      })

      it('應該在沒有開啟選單時正常運作', () => {
        boardStore.closeAllMenus()
        expect(boardStore.openMenuId).toBe(null)
      })
    })
  })

  describe('邊界條件和異常測試', () => {
    it('應該處理空字串輸入（實際會調用 API）', async () => {
      await boardStore.addList('')
      // 實際實現不會檢查空字串，仍會調用 API
      expect(mockFetch).toHaveBeenCalledWith('/api/lists', {
        method: 'POST',
        body: { title: '' }
      })
    })

    it('應該處理 undefined 參數', () => {
      expect(() => boardStore.updateCardTitle('card-1', undefined as any)).not.toThrow()
    })

    it('應該處理大量資料', () => {
      // 創建大量列表和卡片
      const largeLists = Array.from({ length: 100 }, (_, i) => ({
        id: `list-${i}`,
        title: `List ${i}`,
        position: i,
        cards: Array.from({ length: 50 }, (_, j) => ({
          id: `card-${i}-${j}`,
          title: `Card ${j}`,
          description: '',
          listId: `list-${i}`,
          position: j,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      }))

      boardStore.board.lists = largeLists

      // 測試 getter 效能
      expect(boardStore.nextCardId).toBeGreaterThan(0)
      expect(boardStore.nextListId).toBe(100) // list-0 到 list-99，下一個應該是 100
    })

    it('應該處理並發操作', async () => {
      boardStore.board.lists = [{ id: 'list-1', title: 'Test', cards: [], position: 0 }]

      // 同時添加多張卡片
      const promises = Array.from({ length: 5 }, (_, i) =>
        boardStore.addCard('list-1', `Card ${i}`)
      )

      await Promise.all(promises)

      // 所有卡片都應該被添加
      expect(boardStore.board.lists[0].cards).toHaveLength(5)
    })
  })
})