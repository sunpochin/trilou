// 看板狀態管理 Store
interface Card {
  id: string
  title: string
  description?: string
}

interface List {
  id: string
  title: string
  cards: Card[]
}

interface Board {
  id: string
  title: string
  lists: List[]
}

export const useBoardStore = defineStore('board', {
  state: (): { board: Board } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      // 初始列表為空，將從 API 獲取
      lists: []
    }
  }),
  getters: {
    // 動態計算下一個可用的卡片 ID
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
  actions: {
    // 從後端 API 非同步獲取看板資料
    async fetchBoard() {
      try {
        // 同時獲取列表和卡片資料
        const [listsResponse, cardsResponse] = await Promise.all([
          $fetch('/api/lists'),
          $fetch('/api/cards')
        ])

        // 建立卡片 ID 到列表 ID 的映射
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
        if (listsResponse) {
          this.board.lists = listsResponse.map((list: any) => ({
            id: list.id,
            title: list.title,
            cards: cardsByListId[list.id] || []
          }))
        }
      } catch (error) {
        console.error('獲取看板資料失敗:', error)
      }
    },
    // 新增列表
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
        // 新增到本地狀態
        const newList: List = {
          ...response,
          cards: [] // 新列表初始沒有卡片
        }
        console.log('✅ [STORE] 新增到本地狀態:', newList)
        this.board.lists.push(newList)
      } catch (error) {
        console.error('❌ [STORE] 新增列表錯誤:', error)
        
        // 顯示更詳細的錯誤資訊
        if (error && typeof error === 'object') {
          console.error('📋 [STORE] 錯誤詳情:', {
            message: error.message,
            statusCode: error.statusCode,
            statusMessage: error.statusMessage,
            data: error.data
          })
        }
      }
    },
    
    // 刪除列表
    async removeList(listId: string) {
      try {
        await $fetch(`/api/lists/${listId}`, {
          method: 'DELETE'
        })
        
        // 從本地狀態中移除
        const index = this.board.lists.findIndex(list => list.id === listId)
        if (index !== -1) {
          this.board.lists.splice(index, 1)
        }
      } catch (error) {
        console.error('刪除列表錯誤:', error)
      }
    },
    
    // 新增卡片到指定列表
    async addCard(listId: string, title: string) {
      try {
        const { data, error } = await $fetch('/api/cards', {
          method: 'POST',
          body: { 
            title,
            list_id: listId
          }
        })
        
        if (error) {
          console.error('新增卡片失敗:', error)
          return
        }
        
        // 新增到本地狀態
        const list = this.board.lists.find(list => list.id === listId)
        if (list) {
          const newCard: Card = {
            id: data.id,
            title: data.title,
            description: data.description
          }
          list.cards.push(newCard)
        }
      } catch (error) {
        console.error('新增卡片錯誤:', error)
      }
    },
    
    // 從列表中刪除卡片
    async removeCard(listId: string, cardId: string) {
      try {
        await $fetch(`/api/cards/${cardId}`, {
          method: 'DELETE'
        })
        
        // 從本地狀態中移除
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
    moveCard(fromListId: string, toListId: string, cardIndex: number, newIndex?: number) {
      const fromList = this.board.lists.find(list => list.id === fromListId)
      const toList = this.board.lists.find(list => list.id === toListId)
      
      if (fromList && toList && fromList.cards[cardIndex]) {
        const card = fromList.cards.splice(cardIndex, 1)[0]
        // 如果指定了新位置，插入到指定位置，否則加到末尾
        if (newIndex !== undefined) {
          toList.cards.splice(newIndex, 0, card)
        } else {
          toList.cards.push(card)
        }
      }
    },

    // 更新卡片標題
    updateCardTitle(cardId: string, newTitle: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.title = newTitle
          break
        }
      }
    },

    // 更新卡片描述
    updateCardDescription(cardId: string, newDescription: string) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          card.description = newDescription
          break
        }
      }
    }
  }
})