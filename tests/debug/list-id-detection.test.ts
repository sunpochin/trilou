/**
 * 🐛 List ID 識別問題 Debug 測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrelloBoard from '@/components/TrelloBoard.vue'
import { useBoardStore } from '@/stores/boardStore'

const mockMoveCardAndReorder = vi.fn()
global.$fetch = vi.fn().mockResolvedValue({})

describe('🐛 List ID Detection Debug', () => {
  let boardStore: any
  let wrapper: any

  beforeEach(() => {
    const pinia = createTestingPinia({ createSpy: vi.fn })
    boardStore = useBoardStore()
    boardStore.isLoading = false
    boardStore.moveCardAndReorder = mockMoveCardAndReorder
    
    boardStore.board = {
      id: 'board_1',
      title: '測試看板',
      lists: [
        {
          id: 'list_1',
          title: '待辦事項',
          cards: [
            { id: 'card_1', title: '任務一', position: 0 }
          ]
        },
        {
          id: 'list_2',
          title: '進行中',
          cards: [
            { id: 'card_2', title: '任務二', position: 0 }
          ]
        }
      ]
    }

    wrapper = mount(TrelloBoard, { global: { plugins: [pinia] } })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('🔍 分析 sourceListId 識別問題', async () => {
    // 模擬跨列表移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.push(movedCard)

    const component = wrapper.vm as any
    
    // 🎯 測試 Case 1: 正常情況 - 能夠識別 sourceListId
    console.log('\n🎯 Test Case 1: 正常的 from 元素')
    const normalEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockReturnValue('list_1')
        })
      }
    }

    await component.onCardMove(normalEvent)
    
    console.log('正常情況下 moveCardAndReorder 呼叫次數:', mockMoveCardAndReorder.mock.calls.length)
    expect(mockMoveCardAndReorder).toHaveBeenCalledWith(['list_1', 'list_2'])
    
    mockMoveCardAndReorder.mockClear()

    // 🎯 測試 Case 2: 找不到 data-list-id 屬性
    console.log('\n🎯 Test Case 2: 找不到 data-list-id')
    const noDataListIdEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockReturnValue(null) // 找不到 data-list-id
        })
      }
    }

    await component.onCardMove(noDataListIdEvent)
    
    console.log('找不到 data-list-id 時 moveCardAndReorder 呼叫次數:', mockMoveCardAndReorder.mock.calls.length)
    expect(mockMoveCardAndReorder).not.toHaveBeenCalled() // 🚨 這裡是問題！
    
    mockMoveCardAndReorder.mockClear()

    // 🎯 測試 Case 3: closest 返回 null
    console.log('\n🎯 Test Case 3: closest 返回 null')
    const noClosestEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue(null) // closest 找不到元素
      }
    }

    await component.onCardMove(noClosestEvent)
    
    console.log('closest 返回 null 時 moveCardAndReorder 呼叫次數:', mockMoveCardAndReorder.mock.calls.length)
    expect(mockMoveCardAndReorder).not.toHaveBeenCalled() // 🚨 這裡也是問題！
    
    mockMoveCardAndReorder.mockClear()

    // 🎯 測試 Case 4: 沒有 from 屬性
    console.log('\n🎯 Test Case 4: 沒有 from 屬性')
    const noFromEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      }
      // 沒有 from 屬性
    }

    await component.onCardMove(noFromEvent)
    
    console.log('沒有 from 屬性時 moveCardAndReorder 呼叫次數:', mockMoveCardAndReorder.mock.calls.length)
    expect(mockMoveCardAndReorder).not.toHaveBeenCalled() // 🚨 這裡也是問題！
  })

  it('🔍 分析 targetListId 識別問題', async () => {
    const component = wrapper.vm as any
    
    // 🎯 測試當卡片在 store 中找不到時的情況
    console.log('\n🎯 測試找不到 targetListId 的情況')
    
    const ghostCard = { id: 'ghost_card', title: '不存在的卡片', position: 0 }
    
    const ghostEvent = {
      removed: {
        element: ghostCard,  // 這張卡片在任何列表中都找不到
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockReturnValue('list_1')
        })
      }
    }

    await component.onCardMove(ghostEvent)
    
    console.log('找不到 targetListId 時 moveCardAndReorder 呼叫次數:', mockMoveCardAndReorder.mock.calls.length)
    expect(mockMoveCardAndReorder).not.toHaveBeenCalled() // 🚨 預期的問題
  })

  it('💡 提出解決方案', () => {
    console.log('\n💡 問題分析結果:')
    console.log('1. sourceListId 識別失敗的原因:')
    console.log('   - DOM 結構變化導致 closest() 找不到 [data-list-id]')
    console.log('   - 拖拽過程中 DOM 元素被暫時移除')
    console.log('   - 屬性名稱不匹配')
    
    console.log('\n2. targetListId 識別失敗的原因:')
    console.log('   - Vue Draggable 更新狀態的時序問題')
    console.log('   - Store 狀態與 DOM 狀態不同步')
    
    console.log('\n3. 建議的修復方案:')
    console.log('   - 改善 sourceListId 的識別邏輯（多重備援）')
    console.log('   - 優化 targetListId 的識別方法')
    console.log('   - 添加錯誤恢復機制')
  })
})