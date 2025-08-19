/**
 * 🧪 Cards Drag & Drop 測試
 * 
 * 📝 測試 Cards 在同一 list 內及跨 list 拖拽功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrelloBoard from '@/components/TrelloBoard.vue'
import ListItem from '@/components/ListItem.vue'
import { useBoardStore } from '@/stores/boardStore'

// Mock vue-draggable-next
vi.mock('vue-draggable-next', () => ({
  VueDraggableNext: {
    name: 'draggable',
    template: '<div><slot /></div>',
    props: ['list', 'group', 'tag'],
    emits: ['change'],
    setup() {
      return {}
    }
  }
}))

// Mock boardStore methods
const mockMoveCardAndReorder = vi.fn()

// Mock fetch
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
        { id: 'card_2', title: '任務二', position: 1 },
        { id: 'card_3', title: '任務三', position: 2 }
      ]
    },
    {
      id: 'list_2',
      title: '進行中',
      position: 1,
      cards: [
        { id: 'card_4', title: '任務四', position: 0 },
        { id: 'card_5', title: '任務五', position: 1 }
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

describe('Cards Drag & Drop', () => {
  let pinia: any
  let boardStore: any

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    
    boardStore = useBoardStore()
    boardStore.board = JSON.parse(JSON.stringify(mockBoard)) // 深拷貝
    boardStore.isLoading = false
    boardStore.moveCardAndReorder = mockMoveCardAndReorder

    // Mock $fetch 回應
    ;(global.$fetch as any).mockResolvedValue({})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Cards 在同一 List 內拖拽', () => {
    it('應該在同一列表內移動卡片時觸發 moveCardAndReorder', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬同一列表內的卡片移動
      const moveEvent = {
        moved: {
          element: mockBoard.lists[0].cards[0], // 移動第一張卡片
          oldIndex: 0,
          newIndex: 2
        }
      }

      // 手動觸發 onCardMove
      const component = wrapper.vm as any
      await component.onCardMove(moveEvent)

      // 檢查是否呼叫了 moveCardAndReorder，只重新整理當前列表
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_1'])
    })

    it('應該正確識別卡片所在的列表', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬移動 list_2 中的卡片
      const moveEvent = {
        moved: {
          element: mockBoard.lists[1].cards[1], // 移動 list_2 的第二張卡片
          oldIndex: 1,
          newIndex: 0
        }
      }

      const component = wrapper.vm as any
      await component.onCardMove(moveEvent)

      // 應該重新整理 list_2
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_2'])
    })

    it('應該處理找不到卡片列表的情況', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬不存在的卡片
      const moveEvent = {
        moved: {
          element: { id: 'card_not_exist', title: '不存在' },
          oldIndex: 0,
          newIndex: 1
        }
      }

      const component = wrapper.vm as any
      await component.onCardMove(moveEvent)

      // 不應該呼叫 moveCardAndReorder
      expect(mockMoveCardAndReorder).not.toHaveBeenCalled()
    })

    it('應該處理同一列表移動失敗的情況', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // Mock moveCardAndReorder 失敗
      mockMoveCardAndReorder.mockRejectedValue(new Error('API 錯誤'))

      const moveEvent = {
        moved: {
          element: mockBoard.lists[0].cards[0],
          oldIndex: 0,
          newIndex: 1
        }
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const component = wrapper.vm as any
      await component.onCardMove(moveEvent)

      // 檢查錯誤是否被記錄
      expect(consoleSpy).toHaveBeenCalledWith('❌ [COMPONENT] 更新卡片位置失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Cards 跨 List 拖拽', () => {
    it('應該在跨列表移動時觸發 moveCardAndReorder', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬跨列表移動：從 list_1 移動到 list_2
      // 先更新 store 狀態（模擬 vue-draggable 的行為）
      const movedCard = boardStore.board.lists[0].cards[0]
      boardStore.board.lists[0].cards.splice(0, 1) // 從 list_1 移除
      boardStore.board.lists[1].cards.push(movedCard) // 加到 list_2

      // 模擬 removed 事件（跨列表移動會觸發）
      const removeEvent = {
        removed: {
          element: movedCard,
          oldIndex: 0
        },
        from: {
          closest: (selector: string) => {
            if (selector === '[data-list-id]') {
              return {
                getAttribute: (attr: string) => attr === 'data-list-id' ? 'list_1' : null
              }
            }
            return null
          }
        }
      }

      const component = wrapper.vm as any
      await component.onCardMove(removeEvent)

      // 檢查是否呼叫了 moveCardAndReorder，重新整理兩個列表
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_1', 'list_2'])
    })

    it('應該處理跨列表移動到空列表', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬移動到空列表 list_3
      const movedCard = boardStore.board.lists[0].cards[0]
      boardStore.board.lists[0].cards.splice(0, 1)
      boardStore.board.lists[2].cards.push(movedCard)

      const removeEvent = {
        removed: {
          element: movedCard,
          oldIndex: 0
        },
        from: {
          closest: (selector: string) => {
            if (selector === '[data-list-id]') {
              return {
                getAttribute: (attr: string) => attr === 'data-list-id' ? 'list_1' : null
              }
            }
            return null
          }
        }
      }

      const component = wrapper.vm as any
      await component.onCardMove(removeEvent)

      // 應該重新整理 list_1 和 list_3
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_1', 'list_3'])
    })

    it('應該處理找不到來源列表的情況', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬跨列表移動
      const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
      boardStore.board.lists[1].cards.push(movedCard)

      const removeEvent = {
        removed: {
          element: movedCard,
          oldIndex: 0
        },
        from: null // 沒有來源資訊
      }

      const component = wrapper.vm as any
      await component.onCardMove(removeEvent)

      // 🔧 修復後：應該呼叫 moveCardAndReorder（方法3：全列表更新）
      expect(mockMoveCardAndReorder).toHaveBeenCalled()
    })

    it('應該處理跨列表移動失敗的情況', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // Mock moveCardAndReorder 失敗
      mockMoveCardAndReorder.mockRejectedValue(new Error('網路錯誤'))

      const movedCard = boardStore.board.lists[0].cards[0]
      boardStore.board.lists[0].cards.splice(0, 1)
      boardStore.board.lists[1].cards.push(movedCard)

      const removeEvent = {
        removed: {
          element: movedCard,
          oldIndex: 0
        },
        from: {
          closest: (selector: string) => {
            if (selector === '[data-list-id]') {
              return {
                getAttribute: (attr: string) => attr === 'data-list-id' ? 'list_1' : null
              }
            }
            return null
          }
        }
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const component = wrapper.vm as any
      await component.onCardMove(removeEvent)

      // 檢查錯誤是否被記錄
      expect(consoleSpy).toHaveBeenCalledWith('❌ [COMPONENT] 跨列表移動失敗:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('應該處理同列表的 removed 事件', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      // 模擬同列表移動（sourceListId === targetListId）
      const movedCard = boardStore.board.lists[0].cards[0]
      
      const removeEvent = {
        removed: {
          element: movedCard,
          oldIndex: 0
        },
        from: {
          closest: (selector: string) => {
            if (selector === '[data-list-id]') {
              return {
                getAttribute: (attr: string) => attr === 'data-list-id' ? 'list_1' : null
              }
            }
            return null
          }
        }
      }

      const component = wrapper.vm as any
      await component.onCardMove(removeEvent)

      // 🔧 修復後：即使是同列表，也會呼叫 moveCardAndReorder 來確保位置正確
      expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_1', 'list_1'])
    })
  })

  describe('Added 事件處理', () => {
    it('應該正確處理 added 事件但不執行動作', async () => {
      const wrapper = mount(TrelloBoard, {
        global: { plugins: [pinia] },
      })

      const addEvent = {
        added: {
          element: mockBoard.lists[0].cards[0],
          newIndex: 1
        }
      }

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const component = wrapper.vm as any
      await component.onCardMove(addEvent)

      // 應該記錄 added 事件，但不執行實際動作
      expect(consoleSpy).toHaveBeenCalledWith('🔄 [COMPONENT] 卡片被新增到列表:', expect.any(Object))
      expect(consoleSpy).toHaveBeenCalledWith('📝 [COMPONENT] 跨列表移動的 added 事件，由 removed 事件統一處理')

      // 不應該呼叫 moveCardAndReorder
      expect(mockMoveCardAndReorder).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('ListItem 組件的拖拽整合', () => {
    it('應該正確設定 draggable 屬性', () => {
      const listData = mockBoard.lists[0]
      
      const wrapper = mount(ListItem, {
        props: { list: listData },
        global: { plugins: [pinia] },
      })

      // 檢查 draggable 組件存在
      const draggable = wrapper.find('[class="min-h-5"]')
      expect(draggable.exists()).toBe(true)
    })

    it('應該正確 emit card-move 事件', async () => {
      const listData = mockBoard.lists[0]
      
      const wrapper = mount(ListItem, {
        props: { list: listData },
        global: { plugins: [pinia] },
      })

      // 模擬從 ListItem 發送的 card-move 事件
      const moveEvent = { moved: { element: listData.cards[0] } }
      
      // 觸發 draggable 的 change 事件 (透過 $emit)
      wrapper.vm.$emit('card-move', moveEvent)

      // 檢查事件是否被正確 emit
      expect(wrapper.emitted('card-move')).toBeTruthy()
      expect(wrapper.emitted('card-move')![0]).toEqual([moveEvent])
    })

    it('應該在列表中渲染所有卡片', () => {
      const listData = mockBoard.lists[0]
      
      const wrapper = mount(ListItem, {
        props: { list: listData },
        global: { plugins: [pinia] },
      })

      // 檢查所有卡片都被渲染
      const cards = wrapper.findAllComponents({ name: 'Card' })
      expect(cards).toHaveLength(3)

      // 檢查卡片順序
      expect(cards[0].props('card')).toEqual(listData.cards[0])
      expect(cards[1].props('card')).toEqual(listData.cards[1])
      expect(cards[2].props('card')).toEqual(listData.cards[2])
    })
  })
})