// 看板狀態管理 Store
// 定義卡片資料結構
interface Card {
  id: string              // 卡片唯一識別碼
  title: string           // 卡片標題
  description?: string    // 卡片描述（可選）
}

// 定義列表資料結構
interface List {
  id: string     // 列表唯一識別碼
  title: string  // 列表標題
  cards: Card[]  // 列表包含的卡片陣列
}

// 定義看板資料結構
interface Board {
  id: string     // 看板唯一識別碼
  title: string  // 看板標題
  lists: List[]  // 看板包含的列表陣列
}

// 匯出看板狀態管理 Store
export const useBoardStore = defineStore('board', {
  // 定義 Store 的狀態
  state: (): { board: Board } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      // 初始列表為空，將從 API 獲取
      lists: []
    }
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
    // 從後端 API 非同步獲取看板資料
    // 同時載入所有列表和卡片，並建立正確的關聯
    async fetchBoard() {
      try {
        // 同時獲取列表和卡片資料
        const [listsResponse, cardsResponse] = await Promise.all([
          $fetch('/api/lists'),
          $fetch('/api/cards')
        ])

        // 建立卡片 ID 到列表 ID 的映射
        // 將卡片按所屬列表分組，方便後續組合
        const cardsByListId: { [listId: string]: Card[] } = {}
        
        if (cardsResponse) {
          cardsResponse.forEach((card: any) => {
            if (!cardsByListId[card.list_id]) {
              cardsByListId[card.list_id] = []
            }
            cardsByListId[card.list_id].push({
              id: card.id,
              title: card.title,
              description: card.description
            })
          })
        }

        // 將列表和對應的卡片組合起來
        // 每個列表都會包含其對應的卡片陣列
        if (listsResponse) {
          this.board.lists = listsResponse.map((list: any) => ({
            id: list.id,
            title: list.title,
            cards: cardsByListId[list.id] || [] // 如果列表沒有卡片則使用空陣列
          }))
        }
      } catch (error) {
        console.error('獲取看板資料失敗:', error)
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
      try {
        await $fetch(`/api/lists/${listId}`, {
          method: 'DELETE'
        })
        
        // 從本地狀態中移除對應的列表
        const index = this.board.lists.findIndex(list => list.id === listId)
        if (index !== -1) {
          this.board.lists.splice(index, 1)
        }
      } catch (error) {
        console.error('刪除列表錯誤:', error)
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
          return
        }
        
        // 新增到本地狀態
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          const newCard: Card = {
            id: response.id || '',
            title: response.title || title,
            description: response.description || ''
          }
          list.cards.push(newCard)
          console.log('✅ [STORE] 成功新增卡片:', newCard)
        } else {
          console.error('❌ [STORE] 找不到指定的列表:', listId)
        }
      } catch (error) {
        console.error('❌ [STORE] 新增卡片錯誤:', error)
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
    
    // 移動卡片到不同列表（支援拖拉功能）
    // 實現卡片在列表間或列表內的移動操作
    moveCard(fromListId: string, toListId: string, cardIndex: number, newIndex?: number) {
      const fromList = this.board.lists.find(list => list.id === fromListId)
      const toList = this.board.lists.find(list => list.id === toListId)
      
      if (fromList && toList && fromList.cards[cardIndex]) {
        // 從原列表移除卡片
        const card = fromList.cards.splice(cardIndex, 1)[0]
        // 如果指定了新位置，插入到指定位置，否則加到末尾
        if (newIndex !== undefined) {
          toList.cards.splice(newIndex, 0, card)
        } else {
          toList.cards.push(card)
        }
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