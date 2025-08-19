/**
 * 🔧 修復後的 Drag & Drop 測試
 * 
 * 📝 驗證修復後的跨列表移動邏輯是否正常工作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrelloBoard from '@/components/TrelloBoard.vue'
import { useBoardStore } from '@/stores/boardStore'

// 記錄所有 API 呼叫
const apiCalls: Array<{url: string, method: string, body: any}> = []

global.$fetch = vi.fn().mockImplementation((url: string, options: any = {}) => {
  apiCalls.push({
    url,
    method: options.method || 'GET',
    body: options.body
  })
  return Promise.resolve({})
})

describe('🔧 Fixed Drag Drop Test', () => {
  let boardStore: any
  let wrapper: any

  beforeEach(() => {
    apiCalls.length = 0
    
    const pinia = createTestingPinia({ createSpy: vi.fn })
    boardStore = useBoardStore()
    boardStore.isLoading = false
    boardStore.board = {
      id: 'board_1',
      title: '測試看板',
      lists: [
        {
          id: 'list_1',
          title: '待辦事項',
          cards: [
            { id: 'card_1', title: '任務一', position: 0 },
            { id: 'card_2', title: '任務二', position: 1 }
          ]
        },
        {
          id: 'list_2',
          title: '進行中',
          cards: [
            { id: 'card_3', title: '任務三', position: 0 }
          ]
        }
      ]
    }

    wrapper = mount(TrelloBoard, { global: { plugins: [pinia] } })
  })

  it('🎯 方法1成功：正常的 DOM 識別', async () => {
    // 模擬跨列表移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.unshift(movedCard)

    const removeEvent = {
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

    const component = wrapper.vm as any
    await component.onCardMove(removeEvent)

    // 驗證正確的 API 呼叫
    const card1Call = apiCalls.find(call => call.url.includes('card_1'))
    expect(card1Call).toBeTruthy()
    expect(card1Call?.body.list_id).toBe('list_2')
    expect(card1Call?.body.position).toBe(0)

    // 應該更新兩個列表
    expect(apiCalls).toHaveLength(3) // list_2: card_1, card_3; list_1: card_2
  })

  it('🎯 方法3成功：DOM 識別失敗時的全列表更新', async () => {
    // 模擬跨列表移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.push(movedCard)

    const removeEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue(null) // DOM 識別失敗
      }
    }

    const component = wrapper.vm as any
    await component.onCardMove(removeEvent)

    // 驗證 card_1 仍然被正確更新
    const card1Call = apiCalls.find(call => call.url.includes('card_1'))
    expect(card1Call).toBeTruthy()
    expect(card1Call?.body.list_id).toBe('list_2')

    // 由於使用方法3，所有列表都會被更新
    expect(apiCalls.length).toBeGreaterThan(0)
  })

  it('🎯 方法1失敗但方法3成功：沒有 from 屬性', async () => {
    // 模擬跨列表移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.push(movedCard)

    const removeEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      }
      // 完全沒有 from 屬性
    }

    const component = wrapper.vm as any
    await component.onCardMove(removeEvent)

    // 驗證 card_1 仍然被正確更新
    const card1Call = apiCalls.find(call => call.url.includes('card_1'))
    expect(card1Call).toBeTruthy()
    expect(card1Call?.body.list_id).toBe('list_2')
  })

  it('🎯 只更新目標列表：找不到源列表但找到目標列表', async () => {
    // 模擬跨列表移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.push(movedCard)

    const removeEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockReturnValue(null) // 找不到 source
        })
      }
    }

    // Mock console.log 來檢查日誌
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const component = wrapper.vm as any
    await component.onCardMove(removeEvent)

    // 檢查是否使用了方法3（全列表更新）
    expect(consoleSpy).toHaveBeenCalledWith('⚠️ [COMPONENT] 方法1和2都失敗，使用方法3：重新整理所有列表')
    expect(consoleSpy).toHaveBeenCalledWith('✅ [COMPONENT] 方法3：成功重新整理所有列表位置')

    consoleSpy.mockRestore()
  })

  it('🚨 邊界情況：完全找不到卡片', async () => {
    const ghostCard = { id: 'ghost_card', title: '幽靈卡片', position: 0 }

    const removeEvent = {
      removed: {
        element: ghostCard, // 這張卡片不存在於任何列表中
        oldIndex: 0
      },
      from: {
        closest: vi.fn().mockReturnValue({
          getAttribute: vi.fn().mockReturnValue('list_1')
        })
      }
    }

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const component = wrapper.vm as any
    await component.onCardMove(removeEvent)

    // 應該記錄警告
    expect(consoleSpy).toHaveBeenCalledWith('⚠️ [COMPONENT] 無法識別 targetListId，跳過跨列表移動處理')

    // 不應該有任何 API 呼叫
    expect(apiCalls).toHaveLength(0)

    consoleSpy.mockRestore()
  })
})