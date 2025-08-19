/**
 * 🐛 Drag & Drop Debug 測試
 * 
 * 📝 專門用來 debug 跨列表移動時的 position 更新問題
 * 模擬真實的拖拽場景，檢查每個步驟
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TrelloBoard from '@/components/TrelloBoard.vue'
import { useBoardStore } from '@/stores/boardStore'

// 記錄所有 API 呼叫
const apiCalls: Array<{url: string, method: string, body: any}> = []

// Mock fetch 並記錄所有呼叫
global.$fetch = vi.fn().mockImplementation((url: string, options: any = {}) => {
  apiCalls.push({
    url,
    method: options.method || 'GET',
    body: options.body
  })
  return Promise.resolve({})
})

describe('🐛 Drag Drop Position Debug', () => {
  let boardStore: any
  let wrapper: any

  beforeEach(() => {
    apiCalls.length = 0 // 清空記錄
    
    const pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    
    boardStore = useBoardStore()
    boardStore.isLoading = false
    boardStore.board = {
      id: 'board_1',
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
        }
      ]
    }

    wrapper = mount(TrelloBoard, {
      global: { plugins: [pinia] },
    })
  })

  it('🔍 Debug: 完整的跨列表移動流程', async () => {
    console.log('\n🚀 開始測試跨列表移動...')
    
    // 📊 初始狀態
    console.log('\n📊 初始狀態:')
    console.log('List 1 cards:', boardStore.board.lists[0].cards.map((c: any) => `${c.id}(pos:${c.position})`))
    console.log('List 2 cards:', boardStore.board.lists[1].cards.map((c: any) => `${c.id}(pos:${c.position})`))

    // 🎯 步驟 1: 模擬 Vue Draggable 的狀態變化
    // 將 card_1 從 list_1 移動到 list_2 的第一個位置
    console.log('\n🎯 步驟 1: 模擬 Vue Draggable 狀態變化')
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0] // 從 list_1 移除 card_1
    boardStore.board.lists[1].cards.unshift(movedCard) // 加到 list_2 第一個位置

    console.log('移動後狀態:')
    console.log('List 1 cards:', boardStore.board.lists[0].cards.map((c: any) => `${c.id}(pos:${c.position})`))
    console.log('List 2 cards:', boardStore.board.lists[1].cards.map((c: any) => `${c.id}(pos:${c.position})`))

    // 🎯 步驟 2: 模擬拖拽事件
    console.log('\n🎯 步驟 2: 觸發 onCardMove 事件')
    
    // 模擬 removed 事件（跨列表移動的關鍵事件）
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

    // 🔍 步驟 3: 檢查 API 呼叫
    console.log('\n🔍 步驟 3: 分析 API 呼叫記錄')
    console.log('總共呼叫 API 次數:', apiCalls.length)
    
    apiCalls.forEach((call, index) => {
      console.log(`API 呼叫 ${index + 1}:`)
      console.log(`  URL: ${call.url}`)
      console.log(`  Method: ${call.method}`)
      console.log(`  Body:`, JSON.stringify(call.body, null, 2))
    })

    // 🎯 步驟 4: 驗證期望的 API 呼叫
    console.log('\n🎯 步驟 4: 驗證 API 呼叫正確性')

    // 期望的 API 呼叫：
    const expectedCalls = [
      // list_1 的卡片重新排序
      { cardId: 'card_2', listId: 'list_1', position: 0 },
      { cardId: 'card_3', listId: 'list_1', position: 1 },
      // list_2 的卡片重新排序
      { cardId: 'card_1', listId: 'list_2', position: 0 },  // 🚨 這是關鍵！
      { cardId: 'card_4', listId: 'list_2', position: 1 },
      { cardId: 'card_5', listId: 'list_2', position: 2 },
    ]

    console.log('期望的 API 呼叫:')
    expectedCalls.forEach((expected, index) => {
      console.log(`期望 ${index + 1}: PUT /api/cards/${expected.cardId}`, {
        list_id: expected.listId,
        position: expected.position
      })
    })

    // 🔍 關鍵檢查：card_1 是否被正確更新為 list_2
    const card1UpdateCall = apiCalls.find(call => call.url.includes('card_1'))
    
    console.log('\n🚨 關鍵檢查 - card_1 的更新:')
    if (card1UpdateCall) {
      console.log('✅ 找到 card_1 的 API 呼叫:')
      console.log('  list_id:', card1UpdateCall.body.list_id)
      console.log('  position:', card1UpdateCall.body.position)
      
      // 驗證是否正確
      expect(card1UpdateCall.body.list_id).toBe('list_2')
      expect(card1UpdateCall.body.position).toBe(0)
    } else {
      console.log('❌ 沒有找到 card_1 的 API 呼叫！')
      console.log('實際的 API 呼叫:', apiCalls.map(c => c.url))
      throw new Error('Missing API call for card_1')
    }

    // 總體驗證
    expect(apiCalls).toHaveLength(5) // 應該有 5 個 API 呼叫
    
    console.log('\n✅ Debug 測試完成！')
  })

  it('🔍 Debug: 檢查 removed 事件中的列表 ID 識別', async () => {
    console.log('\n🔍 測試列表 ID 識別邏輯...')
    
    // 模擬移動
    const movedCard = boardStore.board.lists[0].cards.splice(0, 1)[0]
    boardStore.board.lists[1].cards.push(movedCard)

    const removeEvent = {
      removed: {
        element: movedCard,
        oldIndex: 0
      },
      from: {
        closest: (selector: string) => {
          console.log('closest() 被呼叫，selector:', selector)
          if (selector === '[data-list-id]') {
            return {
              getAttribute: (attr: string) => {
                console.log('getAttribute() 被呼叫，attr:', attr)
                const result = attr === 'data-list-id' ? 'list_1' : null
                console.log('返回值:', result)
                return result
              }
            }
          }
          return null
        }
      }
    }

    const component = wrapper.vm as any
    
    // 添加一些 debug 日誌到組件方法中
    const originalMethod = component.onCardMove
    component.onCardMove = async function(event: any) {
      console.log('\n🎯 onCardMove 被呼叫:')
      console.log('  event.removed:', !!event.removed)
      if (event.removed) {
        console.log('  element:', event.removed.element.id)
        console.log('  from:', !!event.from)
      }
      
      return originalMethod.call(this, event)
    }

    await component.onCardMove(removeEvent)

    console.log('✅ 列表 ID 識別測試完成')
  })
})