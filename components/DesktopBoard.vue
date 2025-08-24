<!--
  桌面版看板組件 - 專門為桌面版設計
  
  🖥️ 特色：
  - 使用 vue-draggable-next 處理拖拽
  - 優化滑鼠操作體驗
  - 完整的鍵盤支援
  - 不包含手機觸控邏輯
-->

<template>
  <!-- 桌面版看板主容器 - 純桌面優化 -->
  <div 
    class="flex gap-4 p-4 h-[85vh] overflow-x-auto bg-gray-100 font-sans"
    @contextmenu.prevent
    @selectstart.prevent
  >
    
    <!-- 載入狀態：顯示 loading spinner -->
    <div v-if="viewData.isLoading" class="flex items-center justify-center w-full h-full">
      <div class="text-center">
        <SkeletonLoader 
          size="lg" 
          :text="MESSAGES.board.loadingFromCloud"
          color="#3B82F6"
          :animate="true"
        />
      </div>
    </div>

    <!-- 載入完成：顯示實際看板內容 -->
    <template v-else>
      <!-- 可拖拉的列表容器 - 桌面版完整拖拽功能 -->
      <draggable 
        class="flex gap-4" 
        :list="viewData.lists" 
        @change="onListMove"
        tag="div"
        :disabled="false"
        :animation="200"
        ghostClass="list-ghost"
        chosenClass="list-chosen"
        dragClass="list-dragging"
      >
        <ListItem
          v-for="list in viewData.lists" 
          :key="list.id"
          :list="list"
          :dragging="draggingState.isDragging"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
          @card-delete="onCardDelete"
          @card-update-title="onCardUpdateTitle"
          @list-add-card="onListAddCard"
          @list-delete="onListDelete"
          @list-update-title="onListUpdateTitle"
        />
      </draggable>

      <!-- 新增列表區域 - 桌面版固定寬度 -->
      <div class="w-80 p-2 flex-shrink-0">
        <!-- 顯示按鈕模式 -->
        <Transition name="fade" mode="out-in">
          <div 
            v-if="!isAddingList"
            key="button"
            class="bg-gray-200 rounded flex items-start"
          >
            <button 
              class="w-full p-3 bg-transparent border-2 border-dashed border-gray-400 rounded text-gray-700 cursor-pointer text-sm transition-all duration-200 hover:bg-gray-300 hover:border-gray-500" 
              @click="startAddList"
            >
              + {{ MESSAGES.list.addNew }}
            </button>
          </div>
          
          <!-- 顯示 inline 編輯模式 -->
          <div 
            v-else
            key="editor"
            class="bg-gray-200 rounded p-2"
          >
            <div class="bg-white rounded p-3">
              <input
                ref="newListInput"
                v-model="newListTitle"
                placeholder="輸入列表標題..."
                class="w-full border-none outline-none text-sm font-bold mb-2"
                @keydown.enter="saveNewList"
                @keydown.escape="cancelAddList"
              />
              <div class="flex gap-2">
                <button
                  @click="saveNewList"
                  :disabled="!newListTitle.trim()"
                  class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  新增列表
                </button>
                <button
                  @click="cancelAddList"
                  class="px-2 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <!-- 卡片編輯模態框 -->
    <CardModal 
      :show="showCardModal" 
      :card="selectedCard" 
      @close="closeCardModal" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { useCardActions } from '@/composables/useCardActions'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'

// 使用統一的卡片型別定義
type Card = CardUI

// 🖥️ 桌面版：使用 vue-draggable-next 處理所有拖拽
const { addList, deleteList: deleteListAction, updateListTitle: updateListTitleAction } = useListActions()
const { viewData, handleCardMove, handleListMove, loadBoard } = useBoardView()
const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction, addCard: addCardAction } = useCardActions()

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 拖拽狀態管理
const draggingState = ref({
  isDragging: false,
  draggedItem: null as any,
  dragType: null as 'card' | 'list' | null
})

// 新增列表狀態管理
const isAddingList = ref(false)
const newListTitle = ref('')
const newListInput = ref<HTMLInputElement | null>(null)
const isSavingList = ref(false)

// 🖥️ 桌面版：處理卡片拖拽事件（vue-draggable-next）
const onCardMove = async (event: any) => {
  console.log('🖥️ [DESKTOP-DRAG] 卡片移動事件:', event)
  
  if (event.moved) {
    const { element: card } = event.moved
    let currentListId = null
    for (const list of viewData.value.lists) {
      if (list.cards.find((c: any) => c.id === card.id)) {
        currentListId = list.id
        break
      }
    }
    
    if (currentListId) {
      try {
        await handleCardMove([currentListId])
        console.log('✅ [DESKTOP-DRAG] 同列表移動成功')
      } catch (error) {
        console.error('❌ [DESKTOP-DRAG] 移動失敗:', error)
      }
    }
  }
  
  if (event.removed) {
    const { element: card } = event.removed
    let targetListId = null
    for (const list of viewData.value.lists) {
      if (list.cards.find((c: any) => c.id === card.id)) {
        targetListId = list.id
        break
      }
    }
    
    if (targetListId) {
      try {
        await handleCardMove([targetListId])
        console.log('✅ [DESKTOP-DRAG] 跨列表移動成功')
      } catch (error) {
        console.error('❌ [DESKTOP-DRAG] 跨列表移動失敗:', error)
      }
    }
  }
}

// 🖥️ 桌面版：處理列表移動事件（vue-draggable-next）
const onListMove = async (event: any) => {
  console.log('🖥️ [DESKTOP-DRAG] 列表移動事件:', event)
  
  if (event.moved) {
    try {
      await handleListMove()
      console.log('✅ [DESKTOP-DRAG] 列表順序更新成功')
    } catch (error) {
      console.error('❌ [DESKTOP-DRAG] 列表順序更新失敗:', error)
    }
  }
}

const onCardDelete = async (card: CardUI) => {
  console.log('🗑️ [DESKTOP-BOARD] 刪除卡片:', card.title)
  await deleteCardAction(card)
}

const onCardUpdateTitle = async (cardId: string, newTitle: string) => {
  console.log('✏️ [DESKTOP-BOARD] 更新卡片標題:', { cardId, newTitle })
  await updateCardTitleAction(cardId, newTitle)
}

const onListAddCard = async (listId: string, title: string) => {
  console.log('📌 [DESKTOP-BOARD] 新增卡片:', { listId, title })
  await addCardAction(listId, title, 'medium')
}

const onListDelete = async (listId: string) => {
  console.log('🗑️ [DESKTOP-BOARD] 刪除列表:', listId)
  await deleteListAction(listId)
}

const onListUpdateTitle = async (listId: string, newTitle: string) => {
  console.log('✏️ [DESKTOP-BOARD] 更新列表標題:', { listId, newTitle })
  await updateListTitleAction(listId, newTitle)
}

// 開始 inline 新增列表
const startAddList = async () => {
  isAddingList.value = true
  newListTitle.value = ''
  
  // 等待 DOM 更新後聚焦到輸入框
  await nextTick()
  if (newListInput.value) {
    newListInput.value.focus()
  }
}


// 保存新列表 - 重構版：符合依賴反轉原則
const saveNewList = async () => {
  // 防止重複提交
  if (isSavingList.value) return
  
  const titleToSave = newListTitle.value.trim()
  if (!titleToSave) return
  
  isSavingList.value = true
  
  try {
    // 🎯 透過 composable 執行：避免組件直接存取 store (依賴反轉原則)
    await addList(titleToSave)
    
    // 僅成功後才更新 UI
    isAddingList.value = false
    newListTitle.value = ''
    console.log(`✅ [TRELLO-BOARD] 成功創建列表: ${titleToSave}`)
    
  } catch (error) {
    console.error('❌ [TRELLO-BOARD] 創建列表失敗:', error)
    // 失敗則維持輸入以便重試
    isAddingList.value = true
    newListTitle.value = titleToSave
    
  } finally {
    isSavingList.value = false
  }
}

// 取消新增列表
const cancelAddList = () => {
  isAddingList.value = false
  newListTitle.value = ''
}

// 開啟卡片模態框
const openCardModal = (card: Card) => {
  selectedCard.value = card
  showCardModal.value = true
}

// 關閉卡片模態框
const closeCardModal = () => {
  showCardModal.value = false
  selectedCard.value = null
}

// 🖥️ 桌面版組件初始化
onMounted(() => {
  console.log('🖥️ [DESKTOP-BOARD] 桌面版看板初始化完成')
})

// 在組件載入時記錄當前狀態
console.log('🖼️ [DESKTOP-BOARD] 桌面版專用看板載入')
console.log('🖼️ [DESKTOP-BOARD] 使用依賴反轉原則，透過 composable 訪問資料')
</script>

<style scoped>
/* 🖥️ 桌面版專用樣式 */

/* 新增列表過渡動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 🖥️ 桌面版列表拖拽樣式 - 修復：列表不要歪 */
:deep(.list-ghost) {
  background: #e2e8f0 !important;
  border: 2px dashed #64748b !important;
  border-radius: 8px !important;
  opacity: 0.6 !important;
}

:deep(.list-chosen) {
  opacity: 0.8 !important;
  transform: scale(1.01) !important; /* 只放大一點點，不要歪 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.2s ease-out !important;
}

:deep(.list-dragging) {
  /* 🚫 移除歪斜，只保留輕微放大和陰影 */
  transform: scale(1.02) !important; /* 不歪，只放大 */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease-out !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}

/* 🖥️ 桌面版卡片拖拽樣式 - 參考手機版的結構 */
:deep(.desktop-ghost) {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  border: 2px dashed #22c55e !important;
  border-radius: 8px !important;
  opacity: 0.6 !important;
  transform: scale(0.95) !important;
  transition: all 0.2s ease !important;
}

:deep(.desktop-chosen) {
  opacity: 0.95 !important;
  transform: scale(1.03) rotate(-1deg) !important;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25) !important;
  z-index: 999 !important;
  border: 2px solid #10b981 !important;
  background: linear-gradient(135deg, #ffffff, #f0fdf4) !important;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  cursor: grabbing !important;
}

/* 🎯 桌面版拖拽卡片 - 確保跟著滑鼠！ */
:deep(.desktop-drag) {
  transform: scale(1.1) rotate(-3deg) !important; /* 明顯的視覺變化 */
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4) !important; /* 更強烈的陰影 */
  opacity: 0.8 !important; /* 稍微提高透明度讓使用者看得清楚 */
  z-index: 99999 !important; /* 最高層級 */
  border: 3px solid #3b82f6 !important; /* 更明顯的邊框 */
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important; /* 🔑 關鍵：無過渡動畫 */
  cursor: grabbing !important;
  pointer-events: none !important; /* 避免滑鼠事件干擾 */
  position: fixed !important; /* 🔑 關鍵：固定定位跟隨滑鼠 */
}

/* 🔧 Fallback 樣式 - 當使用 force-fallback 時 */
:deep(.sortable-fallback) {
  transform: scale(1.1) rotate(-3deg) !important;
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4) !important;
  opacity: 0.8 !important;
  z-index: 99999 !important;
  border: 3px solid #3b82f6 !important;
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important;
  cursor: grabbing !important;
  pointer-events: none !important;
}

/* 🖥️ 桌面版卡片拖拽樣式 - 兼容舊的 sortable 類別 */
:deep(.sortable-ghost) {
  background: #f0fdf4 !important;
  border: 2px dashed #22c55e !important;
  border-radius: 8px !important;
  opacity: 0.5 !important;
  transform: none !important;
}

:deep(.sortable-chosen) {
  transform: scale(1.02) !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
  opacity: 0.9 !important;
  z-index: 999 !important;
  cursor: grabbing !important;
  transition: all 0.15s ease-out !important;
}

:deep(.sortable-drag) {
  transform: scale(1.05) rotate(-2deg) !important;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4) !important;
  opacity: 0.7 !important;
  z-index: 9999 !important;
  cursor: grabbing !important;
  border: 2px dashed #3b82f6 !important;
  background: rgba(255, 255, 255, 0.95) !important;
  transition: none !important;
  pointer-events: none !important;
}

/* 🖥️ 桌面版容器樣式 */
.desktop-container {
  overflow-x: auto;
}

/* 💯 桌面版拖拽卡片樣式 - 跟隨滑鼠且透明 */
:deep(.sortable-drag .card-draggable) {
  transform: rotate(-3deg) scale(1.08) !important; /* 🔧 輕微傾斜和放大 */
  opacity: 0.75 !important; /* 🔧 透明但不會太透明看不到 */
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4) !important; /* 🔧 更強的陰影 */
  transition: none !important; /* 🔧 無動畫，立即跟隨滑鼠 */
  border: 2px dashed #3b82f6 !important;
  cursor: grabbing !important;
  z-index: 10000 !important; /* 🔧 最高層級 */
  background: rgba(255, 255, 255, 0.95) !important; /* 🔧 半透明背景 */
}

/* 💡 新增：卡片拖拽狀態樣式 */
:deep(.sortable-ghost .card-draggable) {
  background: #f1f5f9 !important;
  border: 2px dashed #64748b !important;
  opacity: 0.5 !important;
}

:deep(.sortable-chosen .card-draggable) {
  transform: scale(1.02) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 響應式間距 */
@media (min-width: 769px) {
  .desktop-container {
    padding: 1rem;
    gap: 1rem;
  }
}

/* 🖥️ 桌面版防止拖拽時選取文字和右鍵選單 */
:global(.card-draggable) {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none; /* 防止長按彈出選單 */
}

/* 🚫 桌面版容器防止右鍵選單 */
.flex.gap-4.p-4 {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
