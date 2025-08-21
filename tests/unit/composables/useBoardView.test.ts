/**
 * 🧪 useBoardView 單元測試
 * 
 * 測試 Rabbit 建議的依賴反轉原則實現
 * 驗證組件不直接依賴 boardStore 的抽象接口
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardView } from '@/composables/useBoardView'

// Mock boardStore
const mockBoardStore = {
  board: {
    lists: []
  },
  isLoading: false,
  moveCardAndReorder: vi.fn(),
  saveListPositions: vi.fn(),
  fetchBoard: vi.fn()
}

vi.mock('@/stores/boardStore', () => ({
  useBoardStore: () => mockBoardStore
}))

describe('useBoardView 測試', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // 重置 mock store 狀態
    mockBoardStore.board.lists = [
      {
        id: 'list-1',
        title: '待辦',
        cards: [
          { id: 'card-1', title: 'Task 1', position: 0 },
          { id: 'card-2', title: 'Task 2', position: 1 }
        ]
      },
      {
        id: 'list-2', 
        title: '進行中',
        cards: [
          { id: 'card-3', title: 'Task 3', position: 0 }
        ]
      }
    ]
    mockBoardStore.isLoading = false
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('viewData 計算屬性', () => {
    it('應該提供正確的視圖資料', () => {
      const { viewData } = useBoardView()
      
      expect(viewData.value).toEqual({
        lists: mockBoardStore.board.lists,
        isLoading: false,
        listsCount: 2,
        isEmpty: false
      })
    })

    it('應該正確反映空看板狀態', () => {
      mockBoardStore.board.lists = []
      
      const { viewData } = useBoardView()
      
      expect(viewData.value.isEmpty).toBe(true)
      expect(viewData.value.listsCount).toBe(0)
    })

    it('應該正確反映載入狀態', () => {
      mockBoardStore.isLoading = true
      
      const { viewData } = useBoardView()
      
      expect(viewData.value.isLoading).toBe(true)
    })
  })

  describe('handleCardMove 方法', () => {
    it('應該正確處理卡片移動', async () => {
      const { handleCardMove } = useBoardView()
      const affectedListIds = ['list-1', 'list-2']
      
      mockBoardStore.moveCardAndReorder.mockResolvedValue(undefined)
      
      await handleCardMove(affectedListIds)
      
      expect(mockBoardStore.moveCardAndReorder).toHaveBeenCalledWith(affectedListIds)
    })

    it('應該跳過空的受影響列表陣列', async () => {
      const { handleCardMove } = useBoardView()
      
      await handleCardMove([])
      
      expect(mockBoardStore.moveCardAndReorder).not.toHaveBeenCalled()
    })

    it('應該正確處理 API 失敗', async () => {
      const { handleCardMove } = useBoardView()
      const error = new Error('API 失敗')
      
      mockBoardStore.moveCardAndReorder.mockRejectedValue(error)
      
      await expect(handleCardMove(['list-1'])).rejects.toThrow('API 失敗')
      expect(mockBoardStore.moveCardAndReorder).toHaveBeenCalledWith(['list-1'])
    })
  })

  describe('handleListMove 方法', () => {
    it('應該正確處理列表移動', async () => {
      const { handleListMove } = useBoardView()
      
      mockBoardStore.saveListPositions.mockResolvedValue(undefined)
      
      await handleListMove()
      
      expect(mockBoardStore.saveListPositions).toHaveBeenCalled()
    })

    it('應該正確處理 API 失敗', async () => {
      const { handleListMove } = useBoardView()
      const error = new Error('保存失敗')
      
      mockBoardStore.saveListPositions.mockRejectedValue(error)
      
      await expect(handleListMove()).rejects.toThrow('保存失敗')
    })
  })

  describe('查詢方法', () => {
    it('findListById 應該正確找到列表', () => {
      const { findListById } = useBoardView()
      
      const foundList = findListById('list-1')
      
      expect(foundList).toBeDefined()
      expect(foundList?.title).toBe('待辦')
    })

    it('findListById 應該處理不存在的列表', () => {
      const { findListById } = useBoardView()
      
      const foundList = findListById('non-existent')
      
      expect(foundList).toBeUndefined()
    })

    it('getAllListIds 應該返回所有列表 ID', () => {
      const { getAllListIds } = useBoardView()
      
      const listIds = getAllListIds()
      
      expect(listIds).toEqual(['list-1', 'list-2'])
    })

    it('getAllListIds 應該處理空列表', () => {
      mockBoardStore.board.lists = []
      
      const { getAllListIds } = useBoardView()
      
      const listIds = getAllListIds()
      
      expect(listIds).toEqual([])
    })
  })

  describe('loadBoard 方法', () => {
    it('應該正確載入看板資料', async () => {
      const { loadBoard } = useBoardView()
      
      mockBoardStore.fetchBoard.mockResolvedValue(undefined)
      
      await loadBoard()
      
      expect(mockBoardStore.fetchBoard).toHaveBeenCalled()
    })

    it('應該正確處理載入失敗', async () => {
      const { loadBoard } = useBoardView()
      const error = new Error('載入失敗')
      
      mockBoardStore.fetchBoard.mockRejectedValue(error)
      
      await expect(loadBoard()).rejects.toThrow('載入失敗')
    })
  })

  describe('SOLID 原則驗證', () => {
    it('應該符合依賴反轉原則 (DIP)', () => {
      // 測試組件不直接依賴具體的 boardStore
      // 而是依賴抽象的 useBoardView 接口
      const { viewData, handleCardMove, handleListMove } = useBoardView()
      
      // viewData 提供抽象的只讀資料介面
      expect(viewData.value).toHaveProperty('lists')
      expect(viewData.value).toHaveProperty('isLoading')
      expect(viewData.value).toHaveProperty('isEmpty')
      
      // 方法提供抽象的操作介面
      expect(typeof handleCardMove).toBe('function')
      expect(typeof handleListMove).toBe('function')
    })

    it('應該符合單一職責原則 (SRP)', () => {
      // useBoardView 只負責提供看板視圖相關的抽象操作
      // 不處理具體的業務邏輯（如驗證、通知等）
      const boardView = useBoardView()
      
      const methods = Object.keys(boardView)
      const expectedMethods = [
        'viewData', 'handleCardMove', 'handleListMove',
        'loadBoard', 'findListById', 'getAllListIds'
      ]
      
      expect(methods.sort()).toEqual(expectedMethods.sort())
    })
  })

  describe('與組件整合測試', () => {
    it('應該提供組件所需的所有接口', () => {
      // 模擬組件使用 useBoardView
      const {
        viewData,
        handleCardMove,
        handleListMove,
        findListById,
        getAllListIds,
        loadBoard
      } = useBoardView()
      
      // 驗證組件能獲取必要資料
      expect(viewData.value.lists).toBeDefined()
      expect(viewData.value.isLoading).toBeDefined()
      
      // 驗證組件能執行必要操作
      expect(handleCardMove).toBeDefined()
      expect(handleListMove).toBeDefined()
      expect(loadBoard).toBeDefined()
      
      // 驗證組件能查詢資料
      expect(findListById).toBeDefined()
      expect(getAllListIds).toBeDefined()
    })

    it('應該支援組件的拖拽操作需求', async () => {
      const { handleCardMove, getAllListIds } = useBoardView()
      
      mockBoardStore.moveCardAndReorder.mockResolvedValue(undefined)
      
      // 模擬組件處理拖拽事件
      const affectedLists = getAllListIds()
      await handleCardMove(affectedLists)
      
      expect(mockBoardStore.moveCardAndReorder).toHaveBeenCalledWith(['list-1', 'list-2'])
    })
  })
})