/**
 * 🎮 看板核心邏輯 Composable
 * 
 * 📖 十歲小朋友解釋：
 * 這個檔案就像是「看板遊戲的規則書」！
 * 不管你是用手機玩還是電腦玩，遊戲規則都一樣：
 * - 怎麼移動卡片
 * - 怎麼新增卡片
 * - 怎麼刪除列表
 * 
 * 🔧 技術說明：
 * 抽取 TrelloBoard 中所有平台無關的邏輯
 * 讓 MobileBoard 和 DesktopBoard 都能使用相同的核心功能
 */

import { ref, computed } from 'vue'
import { useBoardStore } from '@/stores/boardStore'
import type { ListUI, CardUI } from '@/types'

export function useBoardCore() {
  const boardStore = useBoardStore()
  
  // 🎯 響應式資料
  const draggingState = ref({
    isDragging: false,
    draggedItem: null as any,
    draggedType: null as 'card' | 'list' | null
  })
  
  // 🖥️ 螢幕相關
  const screenWidth = ref(window.innerWidth)
  const isMobile = computed(() => screenWidth.value < 768)
  
  // 🎯 看板檢視資料
  const viewData = computed(() => ({
    lists: boardStore.lists as ListUI[]
  }))
  
  /**
   * 🃏 卡片移動處理
   * 十歲小朋友解釋：當你拖動卡片到新位置時，這個函式會處理
   */
  const onCardMove = (event: any) => {
    console.log('🃏 [CORE] 卡片移動事件:', event)
    
    if (event.added) {
      // 卡片被加到新列表
      const { element: card, newIndex } = event.added
      const targetListId = event.to.closest('[data-list-id]')?.getAttribute('data-list-id')
      
      if (targetListId) {
        boardStore.moveCard(card.id, targetListId, newIndex)
        console.log(`🃏 [CORE] 卡片 ${card.title} 移動到列表 ${targetListId}`)
      }
    } else if (event.moved) {
      // 卡片在同列表內重新排序
      const { element: card, newIndex } = event.moved
      const listId = event.from.closest('[data-list-id]')?.getAttribute('data-list-id')
      
      if (listId) {
        boardStore.moveCard(card.id, listId, newIndex)
        console.log(`🃏 [CORE] 卡片 ${card.title} 在列表內重新排序`)
      }
    }
  }
  
  /**
   * 🗂️ 列表操作
   */
  const onListAddCard = (listId: string, title: string) => {
    console.log('➕ [CORE] 新增卡片到列表:', { listId, title })
    boardStore.addCard(listId, title)
  }
  
  const onListDelete = (listId: string) => {
    console.log('🗑️ [CORE] 刪除列表:', listId)
    if (confirm('確定要刪除這個列表嗎？')) {
      boardStore.deleteList(listId)
    }
  }
  
  const onListUpdateTitle = (listId: string, newTitle: string) => {
    console.log('✏️ [CORE] 更新列表標題:', { listId, newTitle })
    boardStore.updateListTitle(listId, newTitle)
  }
  
  /**
   * 🃏 卡片操作
   */
  const onCardDelete = (card: CardUI) => {
    console.log('🗑️ [CORE] 刪除卡片:', card.title)
    if (confirm('確定要刪除這張卡片嗎？')) {
      boardStore.deleteCard(card.id)
    }
  }
  
  const onCardUpdateTitle = (cardId: string, newTitle: string) => {
    console.log('✏️ [CORE] 更新卡片標題:', { cardId, newTitle })
    boardStore.updateCardTitle(cardId, newTitle)
  }
  
  /**
   * 🎮 拖拽狀態管理
   */
  const onDragStart = (item: any, type: 'card' | 'list') => {
    console.log(`🎮 [CORE] 開始拖拽 ${type}:`, item)
    draggingState.value = {
      isDragging: true,
      draggedItem: item,
      draggedType: type
    }
  }
  
  const onDragEnd = () => {
    console.log('🎮 [CORE] 拖拽結束')
    draggingState.value = {
      isDragging: false,
      draggedItem: null,
      draggedType: null
    }
  }
  
  /**
   * 🖼️ 卡片模態框
   */
  const selectedCard = ref<CardUI | null>(null)
  const isCardModalOpen = ref(false)
  
  const openCardModal = (card: CardUI) => {
    console.log('🖼️ [CORE] 開啟卡片模態框:', card.title)
    selectedCard.value = card
    isCardModalOpen.value = true
  }
  
  const closeCardModal = () => {
    console.log('🖼️ [CORE] 關閉卡片模態框')
    selectedCard.value = null
    isCardModalOpen.value = false
  }
  
  /**
   * 📏 視窗尺寸監聽
   */
  const handleResize = () => {
    screenWidth.value = window.innerWidth
    console.log(`📏 [CORE] 螢幕尺寸變化: ${screenWidth.value}px, isMobile: ${isMobile.value}`)
  }
  
  return {
    // 響應式資料
    viewData,
    draggingState,
    screenWidth,
    isMobile,
    selectedCard,
    isCardModalOpen,
    
    // 卡片操作
    onCardMove,
    onCardDelete,
    onCardUpdateTitle,
    openCardModal,
    closeCardModal,
    
    // 列表操作
    onListAddCard,
    onListDelete,
    onListUpdateTitle,
    
    // 拖拽操作
    onDragStart,
    onDragEnd,
    
    // 其他
    handleResize
  }
}