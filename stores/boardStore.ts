// 看板狀態管理 Store
import { defineStore } from 'pinia'

interface Card {
  id: string
  title: string
  content?: string // 可選的內容欄位
  dueDate?: string // 可選的截止日期欄位
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
  state: (): { 
    board: Board
    isModalOpen: boolean
    selectedCardId: string | null
  } => ({
    board: {
      id: 'board-1',
      title: 'My Board',
      lists: [
        {
          id: 'list-1',
          title: 'To Do',
          cards: [
            { id: 'card-1', title: '學習 Vue 3' },
            { id: 'card-2', title: '完成 Trello Clone MVP' }
          ]
        },
        {
          id: 'list-2',
          title: 'In Progress',
          cards: [
            { id: 'card-3', title: '投履歷' },
            { id: 'card-4', title: '面試' }
          ]
        },
        {
          id: 'list-3',
          title: 'Done',
          cards: [
            { id: 'card-5', title: '繼續投履歷跟面試' },
            { id: 'card-6', title: '得到 offer.' }
          ]
        }
      ]
    },
    isModalOpen: false,
    selectedCardId: null
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
    },

    // 取得目前選中的卡片
    selectedCard: (state) => {
      if (!state.selectedCardId) return null
      for (const list of state.board.lists) {
        const card = list.cards.find(card => card.id === state.selectedCardId)
        if (card) return card
      }
      return null
    }
  },
  actions: {
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

    // 更新卡片內容（包含標題和內容）
    updateCard(cardId: string, updates: { title?: string; content?: string }) {
      for (const list of this.board.lists) {
        const card = list.cards.find(card => card.id === cardId)
        if (card) {
          if (updates.title !== undefined) {
            card.title = updates.title
          }
          if (updates.content !== undefined) {
            card.content = updates.content
          }
          break
        }
      }
    },

    // 打開卡片模態框
    openCardModal(cardId: string) {
      this.selectedCardId = cardId
      this.isModalOpen = true
    },

    // 關閉卡片模態框
    closeCardModal() {
      this.isModalOpen = false
      this.selectedCardId = null
    }
  }
})