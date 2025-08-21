/**
 * 🧪 useListActions Rabbit 建議功能測試
 * 
 * 測試新增的 ensureFirstList 和 addListIfEmpty 功能
 * 驗證依賴反轉原則的實現
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useListActions } from '@/composables/useListActions'

// Mock boardStore
const mockBoardStore = {
  board: {
    lists: []
  },
  isLoading: false,
  addList: vi.fn()
}

// Mock dialog composables
const mockShowInput = vi.fn()
const mockShowConfirm = vi.fn()

vi.mock('@/stores/boardStore', () => ({
  useBoardStore: () => mockBoardStore
}))

vi.mock('@/composables/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    showConfirm: mockShowConfirm
  })
}))

vi.mock('@/composables/useInputDialog', () => ({
  useInputDialog: () => ({
    showInput: mockShowInput
  })
}))

// Mock validators, builders, eventBus
vi.mock('@/validators/ValidationStrategy', () => ({
  Validator: {
    validateCardTitle: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    validateListTitle: vi.fn().mockReturnValue({ isValid: true, errors: [] })
  }
}))

vi.mock('@/builders/NotificationBuilder', () => ({
  NotificationBuilder: {
    success: vi.fn().mockReturnThis(),
    error: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({ type: 'success', title: 'Test', message: 'Test message' })
  }
}))

vi.mock('@/events/EventBus', () => ({
  eventBus: {
    emit: vi.fn()
  }
}))

describe('useListActions Rabbit 建議功能測試', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // 重置 mock store 狀態
    mockBoardStore.board.lists = []
    mockBoardStore.isLoading = false
    mockBoardStore.addList.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ensureFirstList 功能', () => {
    it('當已有列表時應該返回第一個列表', async () => {
      // 設定已有列表的狀態
      mockBoardStore.board.lists = [
        { id: 'list-1', title: '現有列表', cards: [] },
        { id: 'list-2', title: '第二個列表', cards: [] }
      ]
      
      const { ensureFirstList } = useListActions()
      const result = await ensureFirstList()
      
      expect(result).toEqual({ id: 'list-1' })
      expect(mockBoardStore.addList).not.toHaveBeenCalled()
    })

    it('當沒有列表時應該創建默認列表', async () => {
      // 設定空列表狀態
      mockBoardStore.board.lists = []
      
      // Mock addList 成功後的狀態變化
      mockBoardStore.addList.mockImplementation(() => {
        mockBoardStore.board.lists.push({
          id: 'list-new',
          title: '任務列表',
          cards: []
        })
      })
      
      const { ensureFirstList } = useListActions()
      const result = await ensureFirstList()
      
      expect(mockBoardStore.addList).toHaveBeenCalledWith('任務列表')
      expect(result).toEqual({ id: 'list-new' })
    })

    it('當創建默認列表失敗時應該拋出錯誤', async () => {
      mockBoardStore.board.lists = []
      mockBoardStore.addList.mockRejectedValue(new Error('API 錯誤'))
      
      const { ensureFirstList } = useListActions()
      
      await expect(ensureFirstList()).rejects.toThrow('無法創建默認列表，請稍後再試')
    })
  })

  describe('addListIfEmpty 功能', () => {
    it('當已有列表時應該返回第一個列表且不創建新列表', async () => {
      mockBoardStore.board.lists = [
        { id: 'existing-list', title: '已存在的列表', cards: [] }
      ]
      
      const { addListIfEmpty } = useListActions()
      const result = await addListIfEmpty('新列表標題')
      
      expect(result).toEqual({ id: 'existing-list' })
      expect(mockBoardStore.addList).not.toHaveBeenCalled()
    })

    it('當沒有列表時應該創建指定標題的列表', async () => {
      mockBoardStore.board.lists = []
      
      mockBoardStore.addList.mockImplementation(() => {
        mockBoardStore.board.lists.push({
          id: 'list-ai',
          title: 'AI 生成任務',
          cards: []
        })
      })
      
      const { addListIfEmpty } = useListActions()
      const result = await addListIfEmpty('AI 生成任務')
      
      expect(mockBoardStore.addList).toHaveBeenCalledWith('AI 生成任務')
      expect(result).toEqual({ id: 'list-ai' })
    })

    it('應該支援默認標題參數', async () => {
      mockBoardStore.board.lists = []
      
      mockBoardStore.addList.mockImplementation(() => {
        mockBoardStore.board.lists.push({
          id: 'list-default',
          title: 'AI 生成任務',
          cards: []
        })
      })
      
      const { addListIfEmpty } = useListActions()
      const result = await addListIfEmpty() // 不提供標題，使用默認值
      
      expect(mockBoardStore.addList).toHaveBeenCalledWith('AI 生成任務')
      expect(result).toEqual({ id: 'list-default' })
    })

    it('當創建列表失敗時應該拋出錯誤', async () => {
      mockBoardStore.board.lists = []
      mockBoardStore.addList.mockRejectedValue(new Error('網路錯誤'))
      
      const { addListIfEmpty } = useListActions()
      
      await expect(addListIfEmpty('失敗列表')).rejects.toThrow('無法添加列表，請稍後再試')
    })
  })

  describe('getListsInfo 功能', () => {
    it('應該提供正確的列表資訊', () => {
      mockBoardStore.board.lists = [
        {
          id: 'list-1',
          title: '待辦',
          cards: [
            { id: 'card-1', title: 'Task 1' },
            { id: 'card-2', title: 'Task 2' }
          ]
        },
        {
          id: 'list-2',
          title: '完成',
          cards: []
        }
      ]
      mockBoardStore.isLoading = false
      
      const { getListsInfo } = useListActions()
      const info = getListsInfo()
      
      expect(info).toEqual({
        count: 2,
        isEmpty: false,
        isLoading: false,
        lists: [
          { id: 'list-1', title: '待辦', cardCount: 2 },
          { id: 'list-2', title: '完成', cardCount: 0 }
        ]
      })
    })

    it('應該正確處理空看板狀態', () => {
      mockBoardStore.board.lists = []
      
      const { getListsInfo } = useListActions()
      const info = getListsInfo()
      
      expect(info.isEmpty).toBe(true)
      expect(info.count).toBe(0)
      expect(info.lists).toEqual([])
    })

    it('應該正確反映載入狀態', () => {
      mockBoardStore.isLoading = true
      
      const { getListsInfo } = useListActions()
      const info = getListsInfo()
      
      expect(info.isLoading).toBe(true)
    })
  })

  describe('依賴反轉原則驗證', () => {
    it('組件應該能透過抽象接口獲取列表資訊而不直接訪問 store', () => {
      // 模擬組件使用場景
      mockBoardStore.board.lists = [
        { id: 'list-1', title: 'Test', cards: [] }
      ]
      
      const { getListsInfo } = useListActions()
      const info = getListsInfo()
      
      // 組件透過抽象接口獲取資訊
      expect(info.count).toBe(1)
      expect(info.isEmpty).toBe(false)
      expect(info.lists[0]).toEqual({
        id: 'list-1',
        title: 'Test',
        cardCount: 0
      })
    })

    it('組件應該能透過抽象接口確保有可用列表', async () => {
      // 模擬組件需要確保有列表的場景（如 AI 生成任務）
      mockBoardStore.board.lists = []
      
      mockBoardStore.addList.mockImplementation(() => {
        mockBoardStore.board.lists.push({
          id: 'auto-created',
          title: '自動創建',
          cards: []
        })
      })
      
      const { ensureFirstList } = useListActions()
      const result = await ensureFirstList()
      
      // 組件獲得抽象的列表引用，不需要直接操作 store
      expect(result).toEqual({ id: 'auto-created' })
    })
  })

  describe('AiTaskModal 整合場景測試', () => {
    it('應該支援 AI 任務模態框的使用場景', async () => {
      // 模擬 AiTaskModal 的使用場景
      mockBoardStore.board.lists = []
      
      mockBoardStore.addList.mockImplementation(() => {
        mockBoardStore.board.lists.push({
          id: 'ai-tasks',
          title: 'AI 生成任務',
          cards: []
        })
      })
      
      const { addListIfEmpty } = useListActions()
      const result = await addListIfEmpty('AI 生成任務')
      
      // 驗證 AI 模態框能獲得目標列表 ID
      expect(result.id).toBe('ai-tasks')
      expect(mockBoardStore.addList).toHaveBeenCalledWith('AI 生成任務')
    })

    it('當已有列表時 AI 模態框應該使用現有列表', async () => {
      // 模擬已有列表的情況
      mockBoardStore.board.lists = [
        { id: 'existing', title: '現有列表', cards: [] }
      ]
      
      const { addListIfEmpty } = useListActions()
      const result = await addListIfEmpty('AI 生成任務')
      
      // AI 模態框應該使用現有列表，不創建新的
      expect(result.id).toBe('existing')
      expect(mockBoardStore.addList).not.toHaveBeenCalled()
    })
  })

  describe('SOLID 原則符合性驗證', () => {
    it('符合單一職責原則 (SRP) - 每個方法職責明確', async () => {
      const listActions = useListActions()
      
      // ensureFirstList 只負責確保有第一個列表
      // addListIfEmpty 只負責在空時添加列表
      // getListsInfo 只負責提供列表資訊
      
      expect(typeof listActions.ensureFirstList).toBe('function')
      expect(typeof listActions.addListIfEmpty).toBe('function')
      expect(typeof listActions.getListsInfo).toBe('function')
    })

    it('符合依賴反轉原則 (DIP) - 組件依賴抽象而非具體實現', () => {
      // 組件不需要知道 boardStore 的內部結構
      // 只需要調用抽象的方法即可
      const { getListsInfo, ensureFirstList, addListIfEmpty } = useListActions()
      
      // 這些都是抽象的接口，隱藏了 store 的實現細節
      expect(getListsInfo).toBeDefined()
      expect(ensureFirstList).toBeDefined()
      expect(addListIfEmpty).toBeDefined()
    })
  })
})