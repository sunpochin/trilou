// 看板狀態管理 Store
import type { CardUI, ListUI, BoardUI } from '@/types'
import { cardRepository } from '@/repositories/CardRepository'
import { listRepository } from '@/repositories/ListRepository'

// 使用統一的型別定義
type Card = CardUI
type List = ListUI  
type Board = BoardUI

// 匯出看板狀態管理 Store
export const useBoardStore = defineStore('board', {
  // 定義 Store 的狀態
  state: (): { board: Board; isLoading: boolean; openMenuId: string | null } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      // 初始列表為空，將從 API 獲取
      lists: []
    },
    // 載入狀態，用於顯示 loading spinner
    isLoading: false,
    // 目前開啟的選單 ID，同時只能有一個選單開啟
    openMenuId: null
  }),
  // Getters: 計算派生狀態
  getters: {
    // 動態計算下一個可用的卡片 ID
    // 用於生成新卡片的唯一識別碼
    nextCardId: (state) => {
      let maxId = 0
      // 遍歷所有列表的所有卡片，找出最大的數字 ID
      for (const list of state.board.lists) {
        for (const card of list.cards) {
          // 提取 card-X 中的數字部分
          const match = card.id.match(/^card-(\d+)$/)
          if (match) {
            const cardNum = parseInt(match[1], 10)
            if (cardNum > maxId) {
              maxId = cardNum
            }
          }
        }
      }
      return maxId + 1
    },

    // 動態計算下一個可用的列表 ID
    // 用於生成新列表的唯一識別碼
    nextListId: (state) => {
      let maxId = 0
      // 遍歷所有列表，找出最大的數字 ID
      for (const list of state.board.lists) {
        // 提取 list-X 中的數字部分
        const match = list.id.match(/^list-(\d+)$/)
        if (match) {
          const listNum = parseInt(match[1], 10)
          if (listNum > maxId) {
            maxId = listNum
          }
        }
      }
      return maxId + 1
    }
  },
  // Actions: 定義可以修改狀態的操作
  actions: {
    // 🔙 恢復穩定的分開查詢 - 簡單可靠的資料獲取
    // 使用分開的 API 調用，確保排序邏輯正確且易於除錯
    async fetchBoard() {
      // 開始載入時設定 loading 狀態
      this.isLoading = true
      const startTime = Date.now()
      
      try {
        console.log('🚀 [STORE] 開始獲取看板資料...')
        
        // 為了更好地展示載入效果，添加一點延遲（僅在開發環境）
        if (import.meta.dev) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        // 🎯 使用 Repository 模式：透過 Repository 層獲取資料
        const [listsResponse, cardsResponse] = await Promise.all([
          listRepository.getAllLists(),
          cardRepository.getAllCards()
        ])

        const fetchTime = Date.now() - startTime
        console.log(`⚡ [STORE] API 調用完成，耗時: ${fetchTime}ms`)

        // 建立卡片 ID 到列表 ID 的映射
        // Repository 已經轉換好格式，直接使用
        const cardsByListId: { [listId: string]: Card[] } = {}
        
        if (cardsResponse) {
          console.log(`📋 [STORE] 處理 ${cardsResponse.length} 張卡片`)
          cardsResponse.forEach((card: Card) => {
            if (!cardsByListId[card.listId]) {
              cardsByListId[card.listId] = []
            }
            cardsByListId[card.listId].push(card)
          })
          
          // 🎯 確保每個列表的卡片都按 position 排序
          Object.keys(cardsByListId).forEach(listId => {
            cardsByListId[listId].sort((a, b) => (a.position || 0) - (b.position || 0))
            console.log(`📝 [STORE] 列表 ${listId} 的卡片排序:`)
            cardsByListId[listId].forEach((card, index) => {
              console.log(`  ${index}: "${card.title}" (position: ${card.position})`)
            })
          })
        }

        // 將列表和對應的卡片組合起來
        // Repository 已經轉換好格式，但我們再次確保排序正確
        if (listsResponse) {
          console.log(`📈 [STORE] 處理 ${listsResponse.length} 個列表`)
          
          // 🎯 組合列表和卡片，並確保按 position 排序
          const listsWithCards: List[] = listsResponse.map((list: List) => ({
            ...list,
            cards: cardsByListId[list.id] || [] // 如果列表沒有卡片則使用空陣列
          }))
          
          // 🔄 按 position 排序，確保重新載入後順序一致
          // 雖然 Repository 已經排序，但為了絕對確保一致性，我們再次排序
          this.board.lists = listsWithCards.sort((a, b) => (a.position || 0) - (b.position || 0))
          
          console.log('📋 [STORE] 列表已按 position 排序:')
          this.board.lists.forEach((list, index) => {
            console.log(`  ${index}: "${list.title}" (position: ${list.position})`)
          })
          
          // 統計載入的資料
          const listsCount = this.board.lists.length
          const cardsCount = this.board.lists.reduce((total, list) => total + list.cards.length, 0)
          
          console.log('📊 [STORE] 載入統計:')
          console.log(`  📋 ${listsCount} 個列表`)
          console.log(`  🎯 ${cardsCount} 張卡片`)
          console.log(`  ⚡ 總耗時: ${Date.now() - startTime}ms`)
          console.log('✅ [STORE] 看板資料載入完成')
        } else {
          console.warn('⚠️ [STORE] listsResponse 為空或 undefined')
          this.board.lists = []
        }
        
      } catch (error) {
        const errorTime = Date.now() - startTime
        console.error(`❌ [STORE] 獲取看板資料失敗，耗時: ${errorTime}ms`)
        console.error('  🔍 錯誤詳情:', error)
        
        // 設定預設空看板以避免 UI 錯誤
        this.board.lists = []
        
      } finally {
        // 無論成功或失敗，都要關閉 loading 狀態
        this.isLoading = false
        const totalTime = Date.now() - startTime
        console.log(`🏁 [STORE] fetchBoard 完成，總耗時: ${totalTime}ms`)
      }
    },
    // 新增列表到看板
    // 發送 API 請求建立新列表，成功後更新本地狀態
    async addList(title: string) {
      console.log('🏪 [STORE] addList 被呼叫，參數:', { title })
      
      try {
        console.log('📤 [STORE] 發送 API 請求到 /api/lists')
        const response = await $fetch('/api/lists', {
          method: 'POST',
          body: { 
            title
          }
        })
        
        console.log('📥 [STORE] API 回應:', response)
        
        // $fetch 會直接拋出錯誤，所以這裡不需要檢查 error 欄位
        // 新增到本地狀態，保持 UI 與後端同步
        const newList: List = {
          ...response,
          cards: [] // 新列表初始沒有卡片
        }
        console.log('✅ [STORE] 新增到本地狀態:', newList)
        this.board.lists.push(newList)
      } catch (error) {
        console.error('❌ [STORE] 新增列表錯誤:', error)
        
        // 顯示更詳細的錯誤資訊，協助除錯
        if (error && typeof error === 'object') {
          console.error('📋 [STORE] 錯誤詳情:', {
            message: (error as any).message,
            statusCode: (error as any).statusCode,
            statusMessage: (error as any).statusMessage,
            data: (error as any).data
          })
        }
      }
    },
    
    // 刪除指定的列表
    // 發送 API 請求刪除列表，成功後從本地狀態移除
    async removeList(listId: string) {
      console.log('🗑️ [STORE] removeList 被呼叫，參數:', { listId })
      
      // 記錄刪除前的狀態
      const targetList = this.board.lists.find(list => list.id === listId)
      if (targetList) {
        console.log('📋 [STORE] 找到要刪除的列表:', {
          id: targetList.id,
          title: targetList.title,
          cardsCount: targetList.cards.length
        })
      } else {
        console.warn('⚠️ [STORE] 警告: 找不到要刪除的列表 ID:', listId)
        return
      }
      
      try {
        console.log('📤 [STORE] 發送 DELETE API 請求到:', `/api/lists/${listId}`)
        
        await $fetch(`/api/lists/${listId}`, {
          method: 'DELETE'
        })
        
        console.log('✅ [STORE] API 刪除請求成功')
        
        // 從本地狀態中移除對應的列表
        const index = this.board.lists.findIndex(list => list.id === listId)
        if (index !== -1) {
          console.log('🔄 [STORE] 從本地狀態移除列表，索引:', index)
          this.board.lists.splice(index, 1)
          console.log('✅ [STORE] 列表已從本地狀態移除，剩餘列表數量:', this.board.lists.length)
        } else {
          console.error('❌ [STORE] 錯誤: 無法在本地狀態中找到要刪除的列表')
        }
      } catch (error) {
        console.error('❌ [STORE] 刪除列表錯誤:')
        console.error('  🔍 錯誤類型:', typeof error)
        console.error('  🔍 錯誤內容:', error)
        
        if (error && typeof error === 'object') {
          console.error('  🔍 錯誤詳情:', {
            message: (error as any).message,
            statusCode: (error as any).statusCode,
            statusMessage: (error as any).statusMessage,
            data: (error as any).data
          })
        }
        
        // 重新拋出錯誤，讓上層處理
        throw error
      }
    },
    
    // 新增卡片到指定列表
    // 使用 Repository 模式建立新卡片，成功後加入對應列表的本地狀態
    async addCard(listId: string, title: string) {
      try {
        // 🎯 使用 Repository 模式：透過 CardRepository 建立卡片
        const newCard = await cardRepository.createCard(title, listId)
        
        // 新增到本地狀態
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          list.cards.push(newCard)
          console.log('✅ [STORE] 成功新增卡片:', newCard)
        } else {
          console.error('❌ [STORE] 找不到指定的列表:', listId)
        }
      } catch (error) {
        console.error('❌ [STORE] 新增卡片錯誤:', error)
        // 重新拋出錯誤，讓呼叫者可以處理
        throw error
      }
    },

    // 儲存列表位置順序到資料庫
    // 透過 Repository 模式處理列表位置更新
    async saveListPositions() {
      try {
        console.log('🚀 [STORE] 開始儲存列表位置順序...')
        
        // 準備更新資料：將每個列表的當前位置收集起來
        const updates = this.board.lists.map((list, index) => {
          console.log(`📝 [STORE] 列表 "${list.title}" 位置: ${index}`)
          return {
            id: list.id,
            position: index
          }
        })
        
        // 🎯 使用 Repository 模式：透過 ListRepository 批量更新
        await listRepository.batchUpdateListPositions(updates)
        
        // 🔄 同步本地 position 屬性，方便之後的排序邏輯
        this.board.lists.forEach((list, index) => {
          list.position = index
        })
        
        console.log('✅ [STORE] 列表位置順序已儲存並同步')
        
      } catch (error) {
        console.error('❌ [STORE] 儲存列表位置失敗:', error)
        throw error // 重新拋出錯誤讓組件可以處理
      }
    },
    
    // 從指定列表中刪除卡片
    // 發送 API 請求刪除卡片，成功後從本地狀態移除
    async removeCard(listId: string, cardId: string) {
      try {
        await $fetch(`/api/cards/${cardId}`, {
          method: 'DELETE'
        })
        
        // 從本地狀態中移除對應的卡片
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          const cardIndex = list.cards.findIndex(card => card.id === cardId)
          if (cardIndex !== -1) {
            list.cards.splice(cardIndex, 1)
          }
        }
      } catch (error) {
        console.error('刪除卡片錯誤:', error)
      }
    },
    
    // 🎯 方案B：完整的卡片移動 + 排序業務邏輯（單一職責）
    // Vue Draggable 已經更新了 UI 狀態，這個函數只負責：
    // 1. 重新計算所有受影響列表的 position
    // 2. 批次更新到資料庫
    // 3. 錯誤處理和資料一致性
    async moveCardAndReorder(affectedListIds: string[]) {
      console.log(`🚀 [STORE] 開始重新整理受影響列表的 position:`, affectedListIds)
      
      try {
        const updates: Array<{id: string, listId: string, position: number}> = []
        
        // 🎯 重新整理所有受影響列表的卡片 position
        for (const listId of affectedListIds) {
          const list = this.board.lists.find(l => l.id === listId)
          if (!list) {
            console.warn(`⚠️ [STORE] 找不到列表 ${listId}`)
            continue
          }
          
          console.log(`📝 [STORE] 重新整理列表 "${list.title}" 的 ${list.cards.length} 張卡片`)
          
          // 為每張卡片重新分配連續的 position 值 (0, 1, 2, 3...)
          list.cards.forEach((card, index) => {
            const newPosition = index
            console.log(`  📌 [STORE] 卡片 "${card.title}" 新位置: ${newPosition}`)
            
            // 收集所有需要更新的卡片資訊
            updates.push({
              id: card.id,
              listId: listId,
              position: newPosition
            })
          })
        }
        
        console.log(`📤 [STORE] 準備批次更新 ${updates.length} 張卡片的位置...`)
        
        // 🎯 使用 Repository 模式：透過 CardRepository 批次更新
        await cardRepository.batchUpdateCards(updates)
        
        console.log(`✅ [STORE] 成功重新整理所有受影響列表的位置`)
        
      } catch (error) {
        console.error('❌ [STORE] 重新整理卡片位置失敗:', error)
        console.error('🔄 [STORE] 建議重新載入看板資料以確保一致性')
        throw error
      }
    },

    // 更新指定卡片的標題
    // 遍歷所有列表找到對應的卡片並更新其標題
    updateCardTitle(cardId: string, newTitle: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.title = newTitle
          break // 找到後立即停止搜尋
        }
      }
    },

    // 更新指定卡片的描述
    // 遍歷所有列表找到對應的卡片並更新其描述
    updateCardDescription(cardId: string, newDescription: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.description = newDescription
          break // 找到後立即停止搜尋
        }
      }
    },

    // 更新指定列表的標題
    // 找到對應的列表並更新其標題，同時寫入資料庫
    async updateListTitle(listId: string, newTitle: string) {
      try {
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          // 先更新前端狀態
          list.title = newTitle
          
          // 🎯 使用 Repository 模式：透過 ListRepository 更新資料庫
          await listRepository.updateListTitle(listId, newTitle)
          console.log(`✅ [STORE] 成功更新列表標題: "${newTitle}"`)
        }
      } catch (error) {
        console.error('❌ [STORE] 更新列表標題失敗:', error)
        throw error
      }
    },

    // 設定開啟的選單 ID，關閉其他所有選單
    // 實現「同時只能有一個選單開啟」的全域狀態控制
    setOpenMenu(listId: string | null) {
      this.openMenuId = listId
    },

    // 切換指定選單的開啟狀態
    // 如果該選單已開啟則關閉，如果其他選單開啟則切換到該選單
    toggleMenu(listId: string) {
      if (this.openMenuId === listId) {
        // 如果點擊的是已開啟的選單，則關閉它
        this.openMenuId = null
      } else {
        // 如果點擊的是其他選單，則開啟它（自動關閉之前開啟的選單）
        this.openMenuId = listId
      }
    },

    // 關閉所有選單
    // 通常在點擊外部區域時呼叫
    closeAllMenus() {
      this.openMenuId = null
    }
  }
})