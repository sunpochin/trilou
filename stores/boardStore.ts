// 看板狀態管理 Store
import type { CardUI, ListUI, BoardUI } from '@/types'

// 使用統一的型別定義
type Card = CardUI
type List = ListUI  
type Board = BoardUI

// 匯出看板狀態管理 Store
export const useBoardStore = defineStore('board', {
  // 定義 Store 的狀態
  state: (): { board: Board; isLoading: boolean } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      // 初始列表為空，將從 API 獲取
      lists: []
    },
    // 載入狀態，用於顯示 loading spinner
    isLoading: false
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
        
        // 🎯 使用穩定的分開查詢：先拿 lists，再拿 cards
        const [listsResponse, cardsResponse] = await Promise.all([
          $fetch('/api/lists'),
          $fetch('/api/cards')
        ])

        const fetchTime = Date.now() - startTime
        console.log(`⚡ [STORE] API 調用完成，耗時: ${fetchTime}ms`)

        // 建立卡片 ID 到列表 ID 的映射
        // 將卡片按所屬列表分組，方便後續組合
        const cardsByListId: { [listId: string]: Card[] } = {}
        
        if (cardsResponse) {
          console.log(`📋 [STORE] 處理 ${cardsResponse.length} 張卡片`)
          cardsResponse.forEach((card: any) => {
            if (!cardsByListId[card.list_id]) {
              cardsByListId[card.list_id] = []
            }
            cardsByListId[card.list_id].push({
              id: card.id,
              title: card.title,
              description: card.description,
              position: card.position
            })
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
        // 每個列表都會包含其對應的卡片陣列
        if (listsResponse) {
          console.log(`📈 [STORE] 處理 ${listsResponse.length} 個列表`)
          this.board.lists = listsResponse.map((list: any) => ({
            id: list.id,
            title: list.title,
            cards: cardsByListId[list.id] || [] // 如果列表沒有卡片則使用空陣列
          }))
          
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
    // 發送 API 請求建立新卡片，成功後加入對應列表的本地狀態
    async addCard(listId: string, title: string) {
      try {
        const response = await $fetch('/api/cards', {
          method: 'POST',
          body: { 
            title,
            list_id: listId
          }
        })
        
        // 檢查 API 回應是否有效
        if (!response || typeof response !== 'object') {
          console.error('API 回應格式錯誤:', response)
          // 拋出錯誤以符合測試期望
          throw new Error('API response format error')
        }
        
        // 新增到本地狀態
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          const newCard: Card = {
            id: response.id || '',
            title: response.title || title,
            description: response.description || '',
            position: response.position
          }
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
        const updatePromises: Promise<any>[] = []
        
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
            
            // 批次收集所有需要更新的 API 請求
            updatePromises.push(
              $fetch(`/api/cards/${card.id}`, {
                method: 'PUT',
                body: {
                  list_id: listId,  // 確保卡片屬於正確的列表
                  position: newPosition
                }
              }).then(() => {
                console.log(`✅ [STORE] 已更新卡片 ${card.id} 位置為 ${newPosition}`)
              }).catch((error) => {
                console.error(`❌ [STORE] 更新卡片 ${card.id} 失敗:`, error)
                throw error
              })
            )
          })
        }
        
        console.log(`📤 [STORE] 批次更新 ${updatePromises.length} 張卡片的位置...`)
        
        // 批次執行所有 API 更新請求
        await Promise.all(updatePromises)
        
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
    }
  }
})