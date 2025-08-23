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
    class="flex gap-4 p-4 h-[85vh] overflow-x-auto bg-gray-100 font-sans"
    :class="{ 'mobile-container': isMobile, 'desktop-container': !isMobile }"
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
      
      <!-- 📱 手機版：使用 @vueuse/gesture -->
      <template v-else>
        <div class="flex gap-4" ref="mobileListsContainer">
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
            class="mobile-list-item"
          />
        </div>
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
import { useGesture } from '@vueuse/gesture'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'

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

// 📱 手機版長按 + 拖拽系統變數
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)
const cardLongPressMode = ref(false)
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

// 📱 手機版：使用 @vueuse/gesture 處理觸控 + 長按邏輯
const setupMobileGestures = () => {
  if (!mobileListsContainer.value) return
  
  console.log('📱 [MOBILE-BOARD] 初始化進階手勢系統...')
  
  // 📱 整個看板的手勢處理（列表切換 + 長按卡片拖拽）
  useGesture({
    onDragStart: ({ event }) => {
      console.log('🔋 [MOBILE-GESTURE] 開始觸控')
      isLongPressing.value = false
      cardLongPressMode.value = false
      
      // 設定 1.5 秒計時器
      longPressTimer.value = window.setTimeout(() => {
        console.log('⏰ [MOBILE-GESTURE] 長按 1.5 秒達成！進入卡片拖拽模式')
        isLongPressing.value = true
        cardLongPressMode.value = true
        // 📳 簡單震動回饋
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 1500)
    },
    
    onDrag: ({ movement, velocity }) => {
      const [mx, my] = movement
      const [vx, vy] = velocity
      
      // 📦 卡片拖拽模式：1.5秒後允許垂直拖拽
      if (cardLongPressMode.value) {
        console.log('📦 [MOBILE-GESTURE] 卡片拖拽模式:', { mx, my })
        // 這時候 vue-draggable-next 應該接手處理卡片拖拽
        return
      }
      
      // 📋 列表切換模式：水平拖拽
      if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 30) {
        console.log('📋 [MOBILE-GESTURE] 列表水平切換:', { mx, vx })
        handleMobileListSwipe(mx, vx)
      }
    },
    
    onDragEnd: ({ movement }) => {
      const [mx] = movement
      console.log('🏁 [MOBILE-GESTURE] 觸控結束')
      
      // 清除計時器
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
      
      // 如果是短時間拖拽，處理列表彈性滾動
      if (!cardLongPressMode.value && Math.abs(mx) > 50) {
        handleMobileListSnapBack(mx)
      }
      
      // 重設狀態
      isLongPressing.value = false
      cardLongPressMode.value = false
    }
  }, {
    domTarget: mobileListsContainer,
    drag: {
      threshold: 5, // 降低閾值，更敏感
    }
  })
  
  console.log('📱 [MOBILE-BOARD] 進階手機手勢系統已初始化')
}

// 📋 手機版列表滑動處理
const handleMobileListSwipe = (deltaX: number, velocityX: number) => {
  if (isListSnapping.value) return
  
  // 簡化版列表切換：直接滾動容器
  if (mobileListsContainer.value) {
    const currentScroll = mobileListsContainer.value.scrollLeft
    const newScroll = Math.max(0, currentScroll - deltaX)
    mobileListsContainer.value.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }
  
  // 使用 velocityX 來決定滑動強度 (日後可擴展)
  console.log('📋 [MOBILE-GESTURE] 滑動速度:', velocityX)
}

// 🎯 手機版列表彈性滾動（像trello）
const handleMobileListSnapBack = (deltaX: number) => {
  if (!mobileListsContainer.value || isListSnapping.value) return
  
  isListSnapping.value = true
  const container = mobileListsContainer.value
  const listWidth = 300 // 列表的大致寬度
  
  console.log('🎯 [MOBILE-GESTURE] 列表彈性滾動:', { deltaX })
  
  // 決定滾動方向和距離
  const direction = deltaX > 0 ? -1 : 1 // 左滑右移，右滑左移
  const currentScroll = container.scrollLeft
  const targetScroll = Math.max(0, currentScroll + (direction * listWidth))
  
  // 平滑滾動到目標位置
  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
  
  // 重設彈性狀態
  setTimeout(() => {
    isListSnapping.value = false
  }, 500)
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
  
  // 如果是手機版，初始化手勢系統
  if (isMobile.value) {
    nextTick(() => {
      setupMobileGestures()
    })
  }
  
  console.log(`🎯 [UNIFIED-BOARD] 組件初始化完成，模式: ${isMobile.value ? '📱 Mobile' : '🖥️ Desktop'}`)
})

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

/* 📱 手機版容器樣式 */
.mobile-container {
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.mobile-list-item {
  width: calc(100vw - 3rem);
  margin: 0 1.5rem;
  max-width: none;
}

/* 🖥️ 桌面版容器樣式 */
.desktop-container {
  overflow-x: auto;
}

/* 💯 修復「歪歪卡片」問題：只對正在被拖拽的卡片套用樣式 */
:deep(.sortable-drag .card-draggable) {
  transform: rotate(-5deg) scale(1.05) !important;
  opacity: 0.8 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.2s ease-out !important;
  border: 2px dashed #3b82f6 !important;
  cursor: grabbing !important;
}

/* 預防拖拽時選取文字 */
:global(.card-draggable) {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
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
@media (max-width: 768px) {
  .mobile-container {
    padding: 1rem;
    gap: 1.5rem;
  }
}

@media (min-width: 769px) {
  .desktop-container {
    padding: 1rem;
    gap: 1rem;
  }
}
</style>
