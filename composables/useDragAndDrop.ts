/**
 * 🖱️ useDragAndDrop = 拖拽魔法師 (讓你可以拖動卡片和列表)
 * 
 * 🤔 想像你在整理房間，要移動很多東西：
 * 
 * ❌ 沒有魔法師的世界：
 * - 想移動書？要記住從哪拿、放到哪、怎麼放
 * - 想移動玩具？又要重新學一套方法
 * - 每種東西的移動方法都不一樣，好複雜
 * - 移動時出錯了不知道怎麼辦
 * 
 * ✅ 有魔法師的世界：
 * - 魔法師說：「你只要拖拉，我幫你處理其他事！」  
 * - 不管是卡片還是列表，拖拉的方法都一樣
 * - 魔法師會記住你正在拖什麼東西
 * - 出錯時魔法師會自動修復
 * 
 * 📋 這個魔法師有什麼魔法？
 * 1. 🎯 追蹤魔法：知道你正在拖什麼 (卡片？列表？)
 * 2. 🚀 開始魔法：當你開始拖拉時，準備好所有需要的東西
 * 3. 🏁 結束魔法：拖拉完成時，把東西放到正確位置  
 * 4. 🔄 移動魔法：自動處理複雜的移動邏輯
 * 5. 🛡️ 保護魔法：出錯時自動回復原狀
 * 
 * 🎯 誰需要這個魔法師？
 * - ListItem.vue (拖動列表裡的卡片)
 * - MobileBoard.vue (手機上的拖拉功能) 
 * - DesktopBoard.vue (電腦上的拖拉功能)
 * 
 * 💡 為什麼需要魔法師？
 * - 拖拉功能很複雜，需要專家處理
 * - 統一的拖拉體驗，不會搞混
 * - 自動處理手機和電腦的差異
 * - 錯誤時會自動修復，用戶不用擔心
 */

import { ref } from 'vue'
import { useBoardView } from '@/composables/useBoardView'
import type { CardUI } from '@/types'

export interface DragItem {
  id: string
  [key: string]: unknown
}

export interface DragEvent {
  moved?: { element: CardUI }
  removed?: { element: CardUI }
  added?: { element: CardUI }
}

export interface DragState {
  isDragging: boolean
  draggedItem: DragItem | null
  dragType: 'card' | 'list' | null
}

/**
 * 拖拽功能的通用邏輯
 * 可在 ListItem、MobileBoard、DesktopBoard 中重用
 */
export function useDragAndDrop() {
  const { viewData, handleCardMove, handleListMove } = useBoardView()
  
  // 拖拽狀態
  const dragState = ref<DragState>({
    isDragging: false,
    draggedItem: null,
    dragType: null
  })

  /**
   * 開始拖拽
   */
  const startDrag = (item: DragItem, type: 'card' | 'list') => {
    console.log(`🎯 [DRAG] 開始拖拽 ${type}:`, item.id)
    
    dragState.value = {
      isDragging: true,
      draggedItem: item,
      dragType: type
    }
  }

  /**
   * 結束拖拽
   */
  const endDrag = () => {
    console.log('✅ [DRAG] 拖拽結束')
    
    dragState.value = {
      isDragging: false,
      draggedItem: null,
      dragType: null
    }
  }

  /**
   * 處理卡片在列表內或跨列表移動
   * @param event - 拖拽事件（來自 vue-draggable-next）
   * @param sourceListId - 來源列表 ID（可選）
   */
  const handleCardDragMove = async (event: any, sourceListId?: string) => {
    console.log('📦 [DRAG] 卡片移動事件:', event)
    
    const affectedListIds: string[] = []
    
    // 處理同列表內移動
    if (event.moved) {
      const { element: card } = event.moved
      
      // 找出卡片所在的列表
      let currentListId = sourceListId
      if (!currentListId) {
        for (const list of viewData.value.lists) {
          if (list.cards.find((c: CardUI) => c.id === card.id)) {
            currentListId = list.id
            break
          }
        }
      }
      
      if (currentListId) {
        affectedListIds.push(currentListId)
      }
    }
    
    // 處理跨列表移動
    if (event.removed || event.added) {
      const card = event.removed?.element || event.added?.element
      
      // 找出目標列表
      for (const list of viewData.value.lists) {
        if (list.cards.find((c: CardUI) => c.id === card.id)) {
          affectedListIds.push(list.id)
        }
      }
    }
    
    // 更新受影響的列表
    if (affectedListIds.length > 0) {
      try {
        await handleCardMove(affectedListIds)
        console.log('✅ [DRAG] 卡片順序更新成功')
      } catch (error) {
        console.error('❌ [DRAG] 卡片順序更新失敗:', error)
        throw error
      }
    }
  }

  /**
   * 處理列表移動
   */
  const handleListDragMove = async (event: any) => {
    console.log('📋 [DRAG] 列表移動事件:', event)
    
    if (event.moved) {
      try {
        await handleListMove()
        console.log('✅ [DRAG] 列表順序更新成功')
      } catch (error) {
        console.error('❌ [DRAG] 列表順序更新失敗:', error)
        throw error
      }
    }
  }

  /**
   * 檢查是否正在拖拽特定項目
   */
  const isDragging = (itemId: string): boolean => {
    return dragState.value.isDragging && 
           dragState.value.draggedItem?.id === itemId
  }

  /**
   * 檢查是否正在拖拽特定類型
   */
  const isDraggingType = (type: 'card' | 'list'): boolean => {
    return dragState.value.isDragging && 
           dragState.value.dragType === type
  }

  return {
    // 狀態
    dragState,
    viewData,
    
    // 方法
    startDrag,
    endDrag,
    handleCardDragMove,
    handleListDragMove,
    isDragging,
    isDraggingType
  }
}

/**
 * 拖拽配置選項
 * 用於 vue-draggable-next 的通用配置
 */
export function getDragOptions(enabled: boolean = true) {
  return {
    animation: 200,
    group: 'cards',
    disabled: !enabled,
    ghostClass: 'ghost-card',
    chosenClass: 'chosen-card',
    dragClass: 'dragging-card',
    delay: 100, // 延遲拖拽 1 秒，區分手機上的「拖曳」vs「滑動看板」
    delayOnTouchOnly: true, // 只在觸控設備上延遲
    touchStartThreshold: 5, // 觸控移動閾值
    forceFallback: false, // 使用原生 HTML5 拖拽
    fallbackClass: 'fallback-card',
    fallbackOnBody: true,
    removeCloneOnHide: true
  }
}

/**
 * 列表拖拽配置
 */
export function getListDragOptions(enabled: boolean = true) {
  return {
    animation: 200,
    group: 'lists',
    disabled: !enabled,
    ghostClass: 'ghost-list',
    chosenClass: 'chosen-list',
    dragClass: 'dragging-list',
    handle: '.list-handle', // 只能通過手柄拖拽
    delay: 150,
    delayOnTouchOnly: true,
    touchStartThreshold: 10,
    forceFallback: false,
    fallbackClass: 'fallback-list',
    fallbackOnBody: true,
    removeCloneOnHide: true
  }
}