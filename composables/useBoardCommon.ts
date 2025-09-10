/**
 * 🎯 useBoardCommon = 看板共用管家 (所有看板都需要的基本功能)
 * 
 * 🤔 想像你有很多間房間（手機版房間、桌面版房間）：
 * 
 * ❌ 沒有管家的世界：
 * - 每間房間都要自己準備桌子、椅子、燈泡
 * - 手機版房間壞了桌子，要自己修
 * - 桌面版房間也壞了桌子，也要自己修  
 * - 兩間房間做一樣的事情，很浪費時間
 * 
 * ✅ 有管家的世界：
 * - 管家負責準備所有房間需要的基本家具
 * - 桌子壞了？管家統一修理，所有房間都能用好桌子
 * - 想要新椅子？管家買一次，所有房間都有新椅子
 * 
 * 📋 這個管家負責什麼工作？
 * 1. 🏠 管理看板的基本狀態 (資料載入中嗎？有多少列表？)
 * 2. 📝 處理列表操作 (新增列表、刪除列表、改列表名字)  
 * 3. 🃏 處理卡片操作 (新增卡片、刪除卡片、改卡片標題)
 * 4. 🪟 管理彈出視窗 (編輯卡片的視窗、AI 生成任務的視窗)
 * 5. 🤖 處理 AI 功能 (讓 AI 幫你想新的任務)
 * 
 * 🎯 誰會使用這個管家？
 * - MobileBoard.vue (手機版看板)
 * - DesktopBoard.vue (桌面版看板)
 * 
 * 💡 為什麼要有這個管家？
 * - 避免重複寫相同的程式碼 (DRY 原則)
 * - 統一管理，修改一個地方就能影響所有看板
 * - 讓程式碼更容易理解和維護
 */

import { ref, nextTick } from 'vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { useCardActions } from '@/composables/useCardActions'
import type { CardUI } from '@/types'
import { eventBus } from '@/events/EventBus'
import type { DragItem, DragEvent } from '@/composables/useDragAndDrop'




/**
 * 看板共用邏輯
 * 包含列表管理、卡片管理、模態框管理等功能
 */
export function useBoardCommon() {
  // ========== Composables ==========
  const { addList, deleteList: deleteListAction, updateListTitle: updateListTitleAction } = useListActions()
  const { viewData, handleCardMove, handleListMove } = useBoardView()
  const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction, addCard: addCardAction } = useCardActions()
  
  // ========== 模態框狀態 ==========
  const showCardModal = ref(false)
  const selectedCard = ref<CardUI | null>(null)
  const showAiModal = ref(false)
  const targetListId = ref<string | null>(null)
  
  // ========== 新增列表狀態 ==========
  const isAddingList = ref(false)
  const newListTitle = ref('')
  const newListInput = ref<HTMLInputElement | null>(null)
  const isSavingList = ref(false)
  
  // ========== 拖拽狀態 ==========
  const draggingState = ref({
    isDragging: false,
    draggedItem: null as DragItem | null,
    dragType: null as 'card' | 'list' | null
  })
  
  // ========== 列表管理函數 ==========
  
  /**
   * 開始新增列表
   */
  const startAddList = async () => {
    isAddingList.value = true
    await nextTick()
    newListInput.value?.focus()
  }
  
  /**
   * 取消新增列表
   */
  const cancelAddList = () => {
    isAddingList.value = false
    newListTitle.value = ''
  }
  
  /**
   * 儲存新列表
   */
  const saveNewList = async () => {
    if (!newListTitle.value.trim() || isSavingList.value) return
    
    isSavingList.value = true
    try {
      await addList(newListTitle.value)
      newListTitle.value = ''
      isAddingList.value = false
      
      // 發送成功通知
      eventBus.emit('notification:success', {
        title: '新增成功',
        message: '列表已新增'
      })
    } catch (error) {
      console.error('新增列表失敗:', error)
      eventBus.emit('notification:error', {
        title: '新增失敗',
        message: '無法新增列表，請稍後再試'
      })
    } finally {
      isSavingList.value = false
    }
  }
  
  /**
   * 刪除列表
   */
  const deleteList = async (listId: string) => {
    try {
      await deleteListAction(listId)
      eventBus.emit('notification:success', {
        title: '刪除成功',
        message: '列表已刪除'
      })
    } catch (error) {
      console.error('刪除列表失敗:', error)
      eventBus.emit('notification:error', {
        title: '刪除失敗',
        message: '無法刪除列表，請稍後再試'
      })
    }
  }
  
  /**
   * 更新列表標題
   */
  const updateListTitle = async (listId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await updateListTitleAction(listId, newTitle)
      eventBus.emit('notification:success', {
        title: '更新成功',
        message: '列表標題已更新'
      })
    } catch (error) {
      console.error('更新列表標題失敗:', error)
      eventBus.emit('notification:error', {
        title: '更新失敗',
        message: '無法更新列表標題，請稍後再試'
      })
    }
  }
  
  // ========== 卡片管理函數 ==========
  
  /**
   * 開啟卡片編輯模態框
   */
  const openCardModal = (card: CardUI) => {
    selectedCard.value = card
    showCardModal.value = true
  }
  
  /**
   * 關閉卡片編輯模態框
   */
  const closeCardModal = () => {
    showCardModal.value = false
    selectedCard.value = null
  }
  
  /**
   * 刪除卡片
   */
  const deleteCard = async (cardId: string) => {
    try {
      await deleteCardAction(cardId)
      eventBus.emit('notification:success', {
        title: '刪除成功',
        message: '卡片已刪除'
      })
    } catch (error) {
      console.error('刪除卡片失敗:', error)
      eventBus.emit('notification:error', {
        title: '刪除失敗',
        message: '無法刪除卡片，請稍後再試'
      })
    }
  }
  
  /**
   * 更新卡片標題
   */
  const updateCardTitle = async (cardId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await updateCardTitleAction(cardId, newTitle)
      eventBus.emit('notification:success', {
        title: '更新成功',
        message: '卡片標題已更新'
      })
    } catch (error) {
      console.error('更新卡片標題失敗:', error)
      eventBus.emit('notification:error', {
        title: '更新失敗',
        message: '無法更新卡片標題，請稍後再試'
      })
    }
  }
  
  /**
   * 新增卡片
   */
  const addCard = async (listId: string, title: string, description?: string) => {
    if (!title.trim()) return
    
    try {
      await addCardAction(listId, title, description)
      eventBus.emit('notification:success', {
        title: '新增成功',
        message: '卡片已新增'
      })
    } catch (error) {
      console.error('新增卡片失敗:', error)
      eventBus.emit('notification:error', {
        title: '新增失敗',
        message: '無法新增卡片，請稍後再試'
      })
    }
  }
  
  // ========== AI 功能 ==========
  
  /**
   * 開啟 AI 生成模態框
   */
  const openAiModal = (listId: string) => {
    targetListId.value = listId
    showAiModal.value = true
  }
  
  /**
   * AI 生成開始事件
   */
  const onAiGenerationStart = () => {
    console.log('🤖 AI 任務生成開始')
  }
  
  /**
   * AI 生成完成事件
   */
  const onAiGenerationComplete = () => {
    console.log('✅ AI 任務生成完成')
    showAiModal.value = false
  }
  
  // ========== 拖拽相關函數 ==========
  
  /**
   * 開始拖拽
   */
  const onDragStart = (item: DragItem, type: 'card' | 'list') => {
    draggingState.value = {
      isDragging: true,
      draggedItem: item,
      dragType: type
    }
    console.log(`🎯 開始拖拽${type === 'card' ? '卡片' : '列表'}:`, item.id)
  }
  
  /**
   * 結束拖拽
   */
  const onDragEnd = () => {
    draggingState.value = {
      isDragging: false,
      draggedItem: null,
      dragType: null
    }
    console.log('✅ 拖拽結束')
  }
  
  /**
   * 處理卡片移動
   */
  const onCardMove = async (event: DragEvent) => {
    if (event.moved || event.removed) {
      try {
        await handleCardMove()
        console.log('✅ 卡片順序更新成功')
      } catch (error) {
        console.error('❌ 卡片順序更新失敗:', error)
      }
    }
  }
  
  /**
   * 處理列表移動
   */
  const onListMove = async (event: any) => {
    if (event.moved) {
      try {
        await handleListMove()
        console.log('✅ 列表順序更新成功')
      } catch (error) {
        console.error('❌ 列表順序更新失敗:', error)
      }
    }
  }
  
  return {
    // 狀態
    viewData,
    showCardModal,
    selectedCard,
    showAiModal,
    targetListId,
    isAddingList,
    newListTitle,
    newListInput,
    isSavingList,
    draggingState,
    
    // 列表管理
    startAddList,
    cancelAddList,
    saveNewList,
    deleteList,
    updateListTitle,
    
    // 卡片管理
    openCardModal,
    closeCardModal,
    deleteCard,
    updateCardTitle,
    addCard,
    
    // AI 功能
    openAiModal,
    onAiGenerationStart,
    onAiGenerationComplete,
    
    // 拖拽功能
    onDragStart,
    onDragEnd,
    onCardMove,
    onListMove
  }
}