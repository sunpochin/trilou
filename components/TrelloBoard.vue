<!--
  統一看板組件 - 條件式 drag handler 架構
  
  📱🖥️ ChatGPT 建議的架構設計：
  
  ✅ 單一 BoardComponent - 控制 desktop/mobile drag handler  
     - Desktop: vue-draggable-next
     - Mobile: @vueuse/gesture  
     
  ✅ 共用 Card/List 組件 - 純渲染和樣式
     - props: cardData, listData, dragging
     - events: @dragStart, @dragEnd
     
  ✅ 條件式邏輯分離
     - 螢幕尺寸偵測決定使用哪種 drag handler
     - UI 元件不需要重複，只有事件綁定不同
-->

<template>
  <!-- 統一看板容器 - 條件式 drag handler -->
  <div 
    ref="boardContainerRef"
    :class="[
      'gap-4 p-4 h-[85vh] bg-gray-100 font-sans',
      isMobile ? 'block overflow-y-auto mobile-container' : 'flex overflow-x-auto desktop-container'
    ]"
  >
    
    <div v-if="isMobile">
      <MobileBoard />
    </div>
    <div v-else>
      <DesktopBoard />
    </div>
  
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
      <!-- 🖥️ 桌面版：使用 vue-draggable-next -->
      <template v-if="!isMobile">
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
      </template>
      
      <!-- 新增列表區域 - 響應式寬度 -->
      <div :class="isMobile ? 'w-[calc(100vw-3rem)] mx-6 max-w-none p-2 flex-shrink-0' : 'w-80 p-2 flex-shrink-0'">
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
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { useCardActions } from '@/composables/useCardActions'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
// import { useGesture } from '@vueuse/gesture' // 暫時不用
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'
import MobileBoard from '@/components/MobileBoard.vue'
import DesktopBoard from '@/components/DesktopBoard.vue'

// 使用統一的卡片型別定義
type Card = CardUI

// 🎯 統一架構：條件式 drag handler
const { addList } = useListActions()
const { viewData, handleCardMove, handleListMove } = useBoardView()

// 📱🖥️ 響應式螢幕尺寸偵測
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)

// DOM 引用
const boardContainerRef = ref<HTMLElement | null>(null)
const mobileListsContainer = ref<HTMLElement | null>(null)

// 🎯 統一的拖拽狀態管理
const draggingState = ref({
  isDragging: false,
  draggedItem: null as any,
  dragType: null as 'card' | 'list' | null
})

// 📱 手機版手勢系統變數（簡化版）
const isListSnapping = ref(false)

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 新增列表狀態管理
const isAddingList = ref(false)
const newListTitle = ref('')
const newListInput = ref<HTMLInputElement | null>(null)

// 🎯 組件已簡化：vue-draggable-next 完全接管拖拽逻輯

// 🎯 統一的卡片操作處理
const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction } = useCardActions()

const onCardDelete = async (card: Card) => {
  console.log('🗑️ [UNIFIED-BOARD] 刪除卡片:', card.title)
  await deleteCardAction(card)
}

const onCardUpdateTitle = async (cardId: string, newTitle: string) => {
  console.log('✏️ [UNIFIED-BOARD] 更新卡片標題:', { cardId, newTitle })
  await updateCardTitleAction(cardId, newTitle)
}

// 🎯 統一的列表操作處理
const { deleteList: deleteListAction, updateListTitle: updateListTitleAction } = useListActions()
const { addCard: addCardAction } = useCardActions()

const onListAddCard = async (listId: string, title: string) => {
  console.log('📌 [UNIFIED-BOARD] 新增卡片:', { listId, title })
  await addCardAction(listId, title, 'medium')
}

const onListDelete = async (listId: string) => {
  console.log('🗑️ [UNIFIED-BOARD] 刪除列表:', listId)
  await deleteListAction(listId)
}

const onListUpdateTitle = async (listId: string, newTitle: string) => {
  console.log('✏️ [UNIFIED-BOARD] 更新列表標題:', { listId, newTitle })
  await updateListTitleAction(listId, newTitle)
}

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

// 🎯 螢幕尺寸變化監聽
const handleResize = () => {
  screenWidth.value = window.innerWidth
  console.log(`📏 [UNIFIED-BOARD] 螢幕尺寸變化: ${screenWidth.value}px, isMobile: ${isMobile.value}`)
}

console.log(`🎯 [UNIFIED-BOARD] 統一看板載入，當前模式: ${isMobile.value ? '📱 Mobile' : '🖥️ Desktop'}`)


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

// 新增狀態管理：防止重複提交
const isSavingList = ref(false)

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

// 🎯 組件初始化：根據螢幕尺寸設定對應功能
onMounted(() => {
  // 監聽螢幕尺寸變化
  window.addEventListener('resize', handleResize)
  
  console.log(`🎯 [UNIFIED-BOARD] 組件初始化完成，模式: ${isMobile.value ? '📱 Mobile' : '🖥️ Desktop'}`)
})

// 📱 手勢初始化已移除，由各別組件負責

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 新增列表過渡動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 預防拖拽時選取文字 - 全域樣式 */
:global(.card-draggable) {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
