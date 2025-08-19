/**
 * 🧪 TrelloBoard 組件 Drag & Drop 測試
 * 
 * 📝 測試 Lists 左右拖拽功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrelloBoard from '@/components/TrelloBoard.vue'
import { useBoardStore } from '@/stores/boardStore'

// Mock vue-draggable-next
vi.mock('vue-draggable-next', () => ({
  VueDraggableNext: {
    name: 'draggable',
    template: '<div><slot /></div>',
    props: ['list', 'group', 'tag'],
    emits: ['change'],
    setup(props: any, { emit }: any) {
      // 模擬 draggable 的 change 事件
      const triggerChange = (event: any) => {
        emit('change', event)
      }
      
      // 將 triggerChange 掛到全域供測試使用
      ;(globalThis as any).__triggerDragChange = triggerChange
      
      return { triggerChange }
    }
  }
}))

// Mock fetch
global.fetch = vi.fn()
global.$fetch = vi.fn()

// Mock 看板資料
const mockBoard = {
  id: 'board_123',
  title: '測試看板',
  lists: [
    {
      id: 'list_1',
      title: '待辦事項',
      position: 0,
      cards: [
        { id: 'card_1', title: '任務一', position: 0 },
        { id: 'card_2', title: '任務二', position: 1 }
      ]
    },
    {
      id: 'list_2',
      title: '進行中',
      position: 1,
      cards: [
        { id: 'card_3', title: '任務三', position: 0 }
      ]
    },
    {
      id: 'list_3',
      title: '已完成',
      position: 2,
      cards: []
    }
  ]
}

describe('TrelloBoard - Lists Drag & Drop', () => {
  let pinia: any
  let boardStore: any

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    
    boardStore = useBoardStore()
    boardStore.board = { ...mockBoard }
    boardStore.isLoading = false
    
    // Mock $fetch 回應
    ;(global.$fetch as any).mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete (globalThis as any).__triggerDragChange
  })

  describe('Lists 左右拖拽', () => {
    it('應該在 lists 拖拽時觸發 onListMove 事件', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬 list 移動事件
      const moveEvent = {
        moved: {
          element: mockBoard.lists[0], // 移動第一個 list
          oldIndex: 0,
          newIndex: 1
        }
      }

      // 手動觸發 onListMove (因為我們 mock 了 draggable)
      const component = wrapper.vm as any
      await component.onListMove(moveEvent)

      // 檢查是否呼叫了 API 更新位置
      expect(global.$fetch).toHaveBeenCalledWith('/api/lists/list_1', {
        method: 'PUT',
        body: { position: 0 }
      })
    })

    it('應該在拖拽後更新所有 lists 的 position', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬將第一個 list 移到最後
      boardStore.board.lists = [
        mockBoard.lists[1], // 原本第二個變第一個
        mockBoard.lists[2], // 原本第三個變第二個
        mockBoard.lists[0]  // 原本第一個變最後
      ]

      const moveEvent = {
        moved: {
          element: mockBoard.lists[0],
          oldIndex: 0,
          newIndex: 2
        }
      }

      const component = wrapper.vm as any
      await component.onListMove(moveEvent)

      // 檢查所有 lists 都被更新了正確的 position
      expect(global.$fetch).toHaveBeenCalledWith('/api/lists/list_2', {
        method: 'PUT',
        body: { position: 0 }
      })
      expect(global.$fetch).toHaveBeenCalledWith('/api/lists/list_3', {
        method: 'PUT',
        body: { position: 1 }
      })
      expect(global.$fetch).toHaveBeenCalledWith('/api/lists/list_1', {
        method: 'PUT',
        body: { position: 2 }
      })
    })

    it('應該處理拖拽失敗的情況', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // Mock API 失敗
      ;(global.$fetch as any).mockRejectedValue(new Error('網路錯誤'))

      const moveEvent = {
        moved: {
          element: mockBoard.lists[0],
          oldIndex: 0,
          newIndex: 1
        }
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const component = wrapper.vm as any
      await component.onListMove(moveEvent)

      // 檢查錯誤是否被記錄
      expect(consoleSpy).toHaveBeenCalledWith('❌ [COMPONENT] 更新列表順序失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('應該只在有 moved 事件時更新位置', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬沒有 moved 的事件 (比如只是 hover)
      const hoverEvent = {
        added: { element: mockBoard.lists[0] }
      }

      const component = wrapper.vm as any
      await component.onListMove(hoverEvent)

      // 不應該呼叫任何 API
      expect(global.$fetch).not.toHaveBeenCalled()
    })

    it('應該正確處理 lists 的渲染', () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 檢查所有 lists 都被渲染
      const listItems = wrapper.findAllComponents({ name: 'ListItem' })
      expect(listItems).toHaveLength(3)

      // 檢查 list 順序正確
      expect(listItems[0].props('list')).toEqual(mockBoard.lists[0])
      expect(listItems[1].props('list')).toEqual(mockBoard.lists[1])
      expect(listItems[2].props('list')).toEqual(mockBoard.lists[2])
    })

    it('應該有正確的 draggable 屬性設定', () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      const draggable = wrapper.find('.flex.gap-4')
      expect(draggable.exists()).toBe(true)
      
      // 檢查 draggable 包含所有 ListItem
      const listItems = draggable.findAllComponents({ name: 'ListItem' })
      expect(listItems).toHaveLength(3)
    })
  })

  describe('載入狀態處理', () => {
    it('應該在載入時顯示 loading', () => {
      boardStore.isLoading = true
      
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 應該顯示 loading
      expect(wrapper.findComponent({ name: 'SkeletonLoader' }).exists()).toBe(true)
      
      // 不應該顯示 draggable lists (檢查是否不存在 ListItem)
      expect(wrapper.findAllComponents({ name: 'ListItem' })).toHaveLength(0)
    })

    it('應該在載入完成後顯示看板內容', () => {
      boardStore.isLoading = false
      
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 不應該顯示 loading
      expect(wrapper.findComponent({ name: 'SkeletonLoader' }).exists()).toBe(false)
      
      // 應該顯示 draggable lists
      expect(wrapper.find('.flex.gap-4').exists()).toBe(true)
    })
  })
})