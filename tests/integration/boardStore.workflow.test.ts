/**
 * 🧪 boardStore 整合測試 - 完整工作流程測試
 * 
 * 測試複雜的業務流程：
 * - 創建看板 -> 添加列表 -> 添加卡片 -> 移動卡片 -> 更新內容 -> 刪除
 * - 樂觀 UI 與 API 的整合測試
 * - 錯誤恢復機制測試
 * - 並發操作測試
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '@/stores/boardStore'

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock repositories
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

import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'

describe('boardStore 整合測試 - 完整工作流程', () => {
  let boardStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    boardStore = useBoardStore()
    
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({})
    
    // Repository mocks
    ;(cardRepository.getAllCards as Mock).mockResolvedValue([])
    ;(listRepository.getAllLists as Mock).mockResolvedValue([])
    ;(cardRepository.batchUpdateCards as Mock).mockResolvedValue(undefined)
    ;(listRepository.batchUpdateListPositions as Mock).mockResolvedValue(undefined)
    ;(listRepository.updateListTitle as Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('完整看板建立流程', () => {
    it('應該能完整建立一個工作看板', async () => {
      // 🎯 場景：從空看板開始建立完整的專案看板
      
      // 步驟1：初始載入空看板
      await boardStore.fetchBoard()
      expect(boardStore.board.lists).toHaveLength(0)

      // 步驟2：添加三個列表（模擬 Trello 風格）
      mockFetch.mockResolvedValueOnce({ id: 'list-1', title: '待辦', position: 0 })
      mockFetch.mockResolvedValueOnce({ id: 'list-2', title: '進行中', position: 1 })
      mockFetch.mockResolvedValueOnce({ id: 'list-3', title: '已完成', position: 2 })

      await Promise.all([
        boardStore.addList('待辦'),
        boardStore.addList('進行中'),
        boardStore.addList('已完成')
      ])

      // 驗證列表已創建並有正確的順序
      expect(boardStore.board.lists).toHaveLength(3)
      expect(boardStore.board.lists[0].title).toBe('待辦')
      expect(boardStore.board.lists[1].title).toBe('進行中')
      expect(boardStore.board.lists[2].title).toBe('已完成')

      // 步驟3：在每個列表中添加卡片
      ;(cardRepository.createCard as Mock)
        .mockResolvedValueOnce({ id: 'card-1', title: '設計 UI 原型', listId: 'list-1', position: 0 })
        .mockResolvedValueOnce({ id: 'card-2', title: '實作登入功能', listId: 'list-1', position: 1 })
        .mockResolvedValueOnce({ id: 'card-3', title: '撰寫單元測試', listId: 'list-2', position: 0 })

      await Promise.all([
        boardStore.addCard('list-1', '設計 UI 原型'),
        boardStore.addCard('list-1', '實作登入功能'),
        boardStore.addCard('list-2', '撰寫單元測試')
      ])

      // 驗證卡片已添加到正確位置
      expect(boardStore.board.lists[0].cards).toHaveLength(2)
      expect(boardStore.board.lists[1].cards).toHaveLength(1)
      expect(boardStore.board.lists[0].cards[0].title).toBe('設計 UI 原型')
      expect(boardStore.board.lists[0].cards[1].title).toBe('實作登入功能')
      expect(boardStore.board.lists[1].cards[0].title).toBe('撰寫單元測試')

      // 步驟4：模擬卡片移動（任務進度更新）
      // 將 '設計 UI 原型' 從 '待辦' 移到 '進行中'
      const movedCard = boardStore.board.lists[0].cards.shift()
      boardStore.board.lists[1].cards.unshift(movedCard)
      
      await boardStore.moveCardAndReorder(['list-1', 'list-2'])

      // 驗證卡片移動後的位置更新
      expect((cardRepository.batchUpdateCards as Mock)).toHaveBeenCalledWith(
        expect.arrayContaining([
          { id: 'card-1', listId: 'list-2', position: 0 }, // 移到 list-2 第一位
          { id: 'card-3', listId: 'list-2', position: 1 }, // 原有卡片下移
          { id: 'card-2', listId: 'list-1', position: 0 }  // list-1 重新排序
        ])
      )
    })

    it('應該處理複雜的多卡片移動場景', async () => {
      // 🎯 場景：模擬真實用戶的複雜拖拽操作
      
      // 準備初始資料：有多張卡片的看板
      boardStore.board.lists = [
        {
          id: 'list-1',
          title: '待辦',
          position: 0,
          cards: [
            { id: 'card-1', title: '任務A', listId: 'list-1', position: 0 },
            { id: 'card-2', title: '任務B', listId: 'list-1', position: 1 },
            { id: 'card-3', title: '任務C', listId: 'list-1', position: 2 }
          ]
        },
        {
          id: 'list-2',
          title: '進行中',
          position: 1,
          cards: [
            { id: 'card-4', title: '任務D', listId: 'list-2', position: 0 },
            { id: 'card-5', title: '任務E', listId: 'list-2', position: 1 }
          ]
        },
        {
          id: 'list-3',
          title: '已完成',
          position: 2,
          cards: []
        }
      ]

      // 模擬複雜的拖拽場景：
      // 1. card-2 從 list-1 移到 list-3
      // 2. card-4 從 list-2 移到 list-1 的第一位
      // 3. card-1 和 card-3 在 list-1 內重新排序

      const list1 = boardStore.board.lists[0]
      const list2 = boardStore.board.lists[1]
      const list3 = boardStore.board.lists[2]

      // 執行複雜移動
      const card2 = list1.cards.splice(1, 1)[0] // 移除 card-2
      const card4 = list2.cards.splice(0, 1)[0] // 移除 card-4
      
      list3.cards.push(card2) // card-2 到 list-3
      list1.cards.unshift(card4) // card-4 到 list-1 第一位
      
      // 更新 listId
      card2.listId = 'list-3'
      card4.listId = 'list-1'

      await boardStore.moveCardAndReorder(['list-1', 'list-2', 'list-3'])

      // 驗證所有列表的卡片都被正確重新排序
      expect((cardRepository.batchUpdateCards as Mock)).toHaveBeenCalledWith(
        expect.arrayContaining([
          // list-1: card-4 (pos 0), card-1 (pos 1), card-3 (pos 2)
          { id: 'card-4', listId: 'list-1', position: 0 },
          { id: 'card-1', listId: 'list-1', position: 1 },
          { id: 'card-3', listId: 'list-1', position: 2 },
          // list-2: card-5 (pos 0)
          { id: 'card-5', listId: 'list-2', position: 0 },
          // list-3: card-2 (pos 0)
          { id: 'card-2', listId: 'list-3', position: 0 }
        ])
      )
    })
  })

  describe('錯誤恢復流程', () => {
    it('應該在 API 失敗時正確回滾樂觀更新', async () => {
      // 🎯 場景：網路不穩定時的用戶體驗
      
      // 準備初始狀態
      boardStore.board.lists = [
        { id: 'list-1', title: '測試列表', position: 0, cards: [] }
      ]

      // 步驟1：新增列表時 API 失敗
      mockFetch.mockRejectedValueOnce(new Error('網路錯誤'))
      const initialListCount = boardStore.board.lists.length

      try {
        await boardStore.addList('失敗的列表')
      } catch (error) {
        // 預期會拋出錯誤
      }

      // 驗證樂觀更新已回滾
      expect(boardStore.board.lists).toHaveLength(initialListCount)
      expect(boardStore.board.lists.find(l => l.title === '失敗的列表')).toBeUndefined()

      // 步驟2：新增卡片時 API 失敗
      ;(cardRepository.createCard as Mock).mockRejectedValueOnce(new Error('服務器錯誤'))
      const initialCardCount = boardStore.board.lists[0].cards.length

      try {
        await boardStore.addCard('list-1', '失敗的卡片')
      } catch (error) {
        // 預期會拋出錯誤
      }

      // 驗證卡片樂觀更新已回滾
      expect(boardStore.board.lists[0].cards).toHaveLength(initialCardCount)
      expect(boardStore.board.lists[0].cards.find(c => c.title === '失敗的卡片')).toBeUndefined()

      // 步驟3：刪除列表時 API 失敗
      mockFetch.mockRejectedValueOnce(new Error('權限不足'))
      const targetList = boardStore.board.lists[0]

      try {
        await boardStore.removeList('list-1')
      } catch (error) {
        // 預期會拋出錯誤
      }

      // 驗證列表已恢復
      expect(boardStore.board.lists).toHaveLength(1)
      expect(boardStore.board.lists[0].id).toBe('list-1')
      expect(boardStore.board.lists[0].title).toBe('測試列表')
    })

    it('應該在部分 API 失敗時保持資料一致性', async () => {
      // 🎯 場景：批次操作中部分失敗的處理
      
      boardStore.board.lists = [
        {
          id: 'list-1',
          title: '測試',
          position: 0,
          cards: [
            { id: 'card-1', title: 'A', listId: 'list-1', position: 0 },
            { id: 'card-2', title: 'B', listId: 'list-1', position: 1 },
            { id: 'card-3', title: 'C', listId: 'list-1', position: 2 }
          ]
        }
      ]

      // 模擬批次更新時部分失敗
      ;(cardRepository.batchUpdateCards as Mock).mockRejectedValueOnce(new Error('批次操作失敗'))

      // 嘗試移動卡片
      await expect(boardStore.moveCardAndReorder(['list-1'])).rejects.toThrow('批次操作失敗')

      // 驗證錯誤被正確拋出，讓上層處理
      expect((cardRepository.batchUpdateCards as Mock)).toHaveBeenCalled()
    })
  })

  describe('效能和併發測試', () => {
    it('應該能處理大量並發的卡片操作', async () => {
      // 🎯 場景：用戶快速連續操作時的穩定性
      
      boardStore.board.lists = [
        { id: 'list-1', title: '測試列表', position: 0, cards: [] }
      ]

      // 設定 repository mock 返回不同的卡片
      let cardIdCounter = 1
      ;(cardRepository.createCard as Mock).mockImplementation(() => 
        Promise.resolve({
          id: `card-${cardIdCounter++}`,
          title: `Card ${cardIdCounter - 1}`,
          listId: 'list-1',
          position: cardIdCounter - 2
        })
      )

      // 並發添加多張卡片
      const promises = Array.from({ length: 10 }, (_, i) =>
        boardStore.addCard('list-1', `並發卡片 ${i + 1}`)
      )

      await Promise.all(promises)

      // 驗證所有卡片都被正確添加
      expect(boardStore.board.lists[0].cards).toHaveLength(10)
      expect((cardRepository.createCard as Mock)).toHaveBeenCalledTimes(10)
    })

    it('應該能處理快速的列表操作', async () => {
      // 🎯 場景：用戶快速創建、重命名、刪除列表
      
      let listIdCounter = 1
      mockFetch.mockImplementation((url, options) => {
        if (options?.method === 'POST') {
          return Promise.resolve({
            id: `list-${listIdCounter++}`,
            title: options.body.title,
            position: listIdCounter - 2
          })
        }
        return Promise.resolve({})
      })

      // 快速創建多個列表
      const createPromises = ['列表A', '列表B', '列表C'].map(title =>
        boardStore.addList(title)
      )
      await Promise.all(createPromises)

      expect(boardStore.board.lists).toHaveLength(3)

      // 快速重命名列表
      ;(listRepository.updateListTitle as Mock).mockResolvedValue({})
      const renamePromises = boardStore.board.lists.map((list, index) =>
        boardStore.updateListTitle(list.id, `重命名列表${index + 1}`)
      )
      await Promise.all(renamePromises)

      // 驗證所有列表標題都已更新
      expect(boardStore.board.lists[0].title).toBe('重命名列表1')
      expect(boardStore.board.lists[1].title).toBe('重命名列表2')
      expect(boardStore.board.lists[2].title).toBe('重命名列表3')
    })
  })

  describe('選單狀態管理整合', () => {
    it('應該在列表操作時正確管理選單狀態', async () => {
      // 🎯 場景：選單開啟時進行列表操作的狀態一致性
      
      boardStore.board.lists = [
        { id: 'list-1', title: '列表1', position: 0, cards: [] },
        { id: 'list-2', title: '列表2', position: 1, cards: [] }
      ]

      // 開啟某個選單
      boardStore.setOpenMenu('list-1')
      expect(boardStore.openMenuId).toBe('list-1')

      // 刪除該列表
      mockFetch.mockResolvedValue({})
      await boardStore.removeList('list-1')

      // 驗證列表已刪除，但選單狀態仍然存在（這可能是預期行為）
      expect(boardStore.board.lists.find(l => l.id === 'list-1')).toBeUndefined()
      // 注意：這裡可以討論是否應該自動關閉已刪除列表的選單
      
      // 切換到另一個選單應該正常工作
      boardStore.toggleMenu('list-2')
      expect(boardStore.openMenuId).toBe('list-2')
    })
  })

  describe('資料一致性驗證', () => {
    it('應該保持 position 的連續性和唯一性', async () => {
      // 🎯 場景：確保所有操作後 position 都是連續且唯一的
      
      // 建立複雜的初始狀態
      boardStore.board.lists = [
        {
          id: 'list-1',
          title: '複雜列表',
          position: 0,
          cards: [
            { id: 'card-1', title: 'A', listId: 'list-1', position: 0 },
            { id: 'card-2', title: 'B', listId: 'list-1', position: 2 }, // 故意跳號
            { id: 'card-3', title: 'C', listId: 'list-1', position: 5 }  // 故意跳號
          ]
        }
      ]

      // 執行重新排序
      await boardStore.moveCardAndReorder(['list-1'])

      // 驗證 position 被修正為連續數字
      const updates = (cardRepository.batchUpdateCards as Mock).mock.calls[0][0]
      const positions = updates.map(update => update.position).sort((a, b) => a - b)
      
      expect(positions).toEqual([0, 1, 2]) // 應該是連續的 0, 1, 2
      
      // 驗證所有卡片都有正確的 listId
      updates.forEach(update => {
        expect(update.listId).toBe('list-1')
        expect(update.id).toMatch(/^card-/)
      })
    })
  })
})