// 看板狀態管理 Store
interface Card {
  id: string
  title: string
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
            { id: 'card-1', title: '投履歷' },
            { id: 'card-2', title: '面試' }
          ]
        },
        {
          id: 'list-3',
          title: 'Done',
          cards: [
            { id: 'card-1', title: '繼續投履歷跟面試' },
            { id: 'card-2', title: '得到 offer.' }

          ]
        }
      ]
    }
  }),
  actions: {
    // 新增列表
    addList(title: string) {
      const newList: List = {
        id: `list-${Date.now()}`,
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
          id: `card-${Date.now()}`,
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
    }
  }
})