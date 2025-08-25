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
  /**
   * 🎯 Core 層樂觀更新系統 - 統一的智慧策略
   * 
   * 📋 設計原則：
   * - 🗑️ 刪除：需要確認 + 等待結果（安全第一）
   * - ✏️ 編輯：樂觀更新（速度優先）
   * - 📌 新增：樂觀更新 + 錯誤處理（平衡體驗）
   */
  
  // 📌 新增卡片 - 樂觀更新策略
  const onListAddCard = async (listId: string, title: string) => {
    console.log('➕ [CORE] 新增卡片到列表:', { listId, title })
    
    try {
      // Store 已實現樂觀更新，這裡處理錯誤
      await boardStore.addCard(listId, title)
      console.log('✅ [CORE] 卡片新增完成')
    } catch (error) {
      console.error('❌ [CORE] 新增卡片失敗:', error)
      // 用戶友好的錯誤處理
      alert('新增卡片失敗，請檢查網路連線後再試')
    }
  }
  
  // 🗑️ 刪除列表 - 需要確認的重要操作
  const onListDelete = async (listId: string) => {
    console.log('🗑️ [CORE] 刪除列表:', listId)
    
    try {
      // 刪除操作需要明確反饋
      await boardStore.removeList(listId)
      console.log('✅ [CORE] 列表刪除成功')
    } catch (error) {
      console.error('❌ [CORE] 列表刪除失敗:', error)
      alert('刪除失敗，請稍後再試')
    }
  }
  
  // ✏️ 列表標題更新 - 樂觀更新策略
  const onListUpdateTitle = async (listId: string, newTitle: string) => {
    console.log('✏️ [CORE] 更新列表標題:', { listId, newTitle })
    
    // 🚀 樂觀更新：不等待，讓用戶感覺超快
    boardStore.updateListTitle(listId, newTitle).catch(error => {
      console.error('❌ [CORE] 列表標題更新失敗:', error)
      // Store 層已處理回滾
    })
    
    console.log('⚡ [CORE] 列表標題樂觀更新完成')
  }
  
  /**
   * 🃏 卡片操作 - 同樣的智慧策略
   */
  
  // 🗑️ 刪除卡片 - 需要確認的重要操作
  const onCardDelete = async (card: CardUI) => {
    console.log('🗑️ [CORE] 刪除卡片:', card.title)
    
    try {
      // 刪除操作需要明確反饋
      await boardStore.removeCard(card.listId, card.id)
      console.log('✅ [CORE] 卡片刪除成功')
    } catch (error) {
      console.error('❌ [CORE] 卡片刪除失敗:', error)
      alert('刪除失敗，請稍後再試')
    }
  }
  
  // ✏️ 卡片標題更新 - 樂觀更新策略
  const onCardUpdateTitle = (cardId: string, newTitle: string) => {
    console.log('✏️ [CORE] 更新卡片標題:', { cardId, newTitle })
    
    // 🚀 樂觀更新：直接更新本地狀態，超快體驗
    // 這個方法是同步的，所以不需要 catch
    boardStore.updateCardTitle(cardId, newTitle)
    
    console.log('⚡ [CORE] 卡片標題更新完成')
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