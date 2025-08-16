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
      // 使用 Nuxt 的 useFetch 來呼叫我們建立的 API 端點
      const { data, error } = await useFetch<List[]>('/api/lists');

      if (error.value) {
        console.error('獲取看板資料失敗:', error.value);
        // 可以在此處加入錯誤處理 UI 邏輯
        return;
      }

      if (data.value) {
        // 將獲取到的列表資料設定到 state 中
        this.board.lists = data.value;
      }
    },
    // 新增列表
    addList(title: string) {
      const newList: List = {
        id: `list-${this.nextListId}`,
        title,
        cards: []
      }
      this.board.lists.push(newList)
    },
    
    // 刪除列表
    removeList(listId: string) {
      const index = this.board.lists.findIndex(list => list.id === listId)
      if (index !== -1) {
        this.board.lists.splice(index, 1)
      }
    },
    
    // 新增卡片到指定列表
    addCard(listId: string, title: string) {
      const list = this.board.lists.find(list => list.id === listId)
      if (list) {
        const newCard: Card = {
          id: `card-${this.nextCardId}`,
          title
        }
        list.cards.push(newCard)
      }
    },
    
    // 從列表中刪除卡片
    removeCard(listId: string, cardId: string) {
      const list = this.board.lists.find(list => list.id === listId)
      if (list) {
        const cardIndex = list.cards.findIndex(card => card.id === cardId)
        if (cardIndex !== -1) {
          list.cards.splice(cardIndex, 1)
        }
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