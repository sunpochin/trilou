<!--
  📱 手機版看板組件 - 專為行動裝置優化
  
  🎯 核心功能：
  ✅ 雙模式切換系統
     - 滑動模式（預設）：左右滑動瀏覽列表
     - 排序模式：拖曳列表交換位置
  
  ✅ 列表拖曳功能
     - 拖曳把手設計：長按 0.3 秒啟動
     - 視覺提示：灰色把手區域 + 文字說明
     - 流暢動畫：200ms 過渡效果
  
  ✅ 卡片拖曳功能  
     - 長按 0.75 秒啟動卡片拖拽
     - 支援跨列表移動
     - Fallback 模式確保手機相容性
  
  📱 使用方式：
  1. 點右下角藍色按鈕 → 進入排序模式
  2. 長按列表上方灰色把手 → 拖動列表
  3. 點綠色按鈕 → 回到滑動模式
  
  🔧 技術實作：
  - vue-draggable-next：處理拖拽
  - snap-scroll：列表滑動對齊
  - @vueuse/gesture：手勢控制
  - 完整 CRUD 功能
-->

<template>
  <!-- 手機版看板容器 -->
  <div 
    ref="boardContainerRef"
    style="margin: 0; padding: 0; width: 100vw; box-sizing: border-box; position: relative;"
    class="block overflow-y-auto mobile-container gap-4 h-[85vh] bg-gray-100 font-sans"
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
      <!-- 🎯 簡化後移除 Debug 資訊 -->
      <!-- 📱 手機版列表容器 - 支援拖曳重排與彈性滾動 -->
      <!-- 💡 十歲小朋友解釋：這個容器讓你可以「拖曳整個列表」換位置！ -->
      <draggable
        v-if="isListDragMode"
        class="flex overflow-x-auto scroll-smooth mobile-lists-container gap-2 p-1"
        :list="viewData.lists"
        @change="onListMove"
        tag="div"
        :disabled="false"
        :force-fallback="true"
        :fallback-on-body="true"
        :delay="300"
        :delay-on-touch-only="true"
        :touch-start-threshold="10"
        :animation="200"
        ghost-class="mobile-list-ghost"
        chosen-class="mobile-list-chosen"
        drag-class="mobile-list-drag"
        handle=".list-drag-handle"
      >
        <div v-for="list in viewData.lists" :key="list.id" class="mobile-list-wrapper">
          <!-- 🎯 列表拖曳把手 - 長按這裡可以拖動整個列表 -->
          <div class="list-drag-handle bg-gray-300 hover:bg-gray-400 rounded-t-lg p-2 flex items-center justify-center cursor-move">
            <div class="flex items-center gap-2 text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
              <span class="text-xs font-medium">長按拖動列表</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </div>
          </div>
          <ListItem
            :list="list"
            :dragging="draggingState.isDragging"
            :is-mobile="true"
            :is-dragging-disabled="isDraggingDisabled"
            :ai-generating-list-id="aiGeneratingListId"
            @card-move="onCardMove"
            @open-card-modal="openCardModal"
            @card-delete="deleteCardWithUndo"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @card-update-title="onCardUpdateTitle"
            @list-add-card="onListAddCard"
            @list-delete="onListDelete"
            @list-update-title="onListUpdateTitle"
            @ai-generate="onAiGenerate"
            class="mobile-list-item"
            style="width: calc(100vw - 2rem); max-width: 400px;"
          />
        </div>
      </draggable>
      
      <!-- 原本的滑動模式 (預設) -->
      <div 
        v-else
        class="flex overflow-x-auto scroll-smooth snap-x snap-mandatory mobile-lists-container gap-2 p-1" 
        ref="mobileListsContainer"
        style="scroll-snap-type: x mandatory;"
      >
        <ListItem
          v-for="list in viewData.lists" 
          :key="list.id"
          :list="list"
          :dragging="draggingState.isDragging"
          :is-mobile="true"
          :is-dragging-disabled="isDraggingDisabled"
          :ai-generating-list-id="aiGeneratingListId"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
          @card-delete="deleteCardWithUndo"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @card-update-title="onCardUpdateTitle"
          @list-add-card="onListAddCard"
          @list-delete="onListDelete"
          @list-update-title="onListUpdateTitle"
          @ai-generate="onAiGenerate"
          class="mobile-list-item snap-center"
          style="width: calc(100vw - 2rem); max-width: 400px;"
        />
      </div>
      
      <!-- 🔄 切換拖曳模式按鈕 -->
      <div class="fixed bottom-20 right-4 z-50">
        <button
          @click="toggleListDragMode"
          :class="[
            'px-4 py-2 rounded-full shadow-lg text-white transition-all duration-300',
            isListDragMode 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          ]"
        >
          <div class="flex items-center gap-2">
            <svg v-if="!isListDragMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm font-medium">
              {{ isListDragMode ? '滑動模式' : '排序模式' }}
            </span>
          </div>
        </button>
      </div>

      <!-- 新增列表區域 - 手機版全寬度 -->
      <div 
        class="mx-2 p-2 flex-shrink-0 mobile-add-list-item"
style="width: calc(100vw - 2rem); max-width: 420px;"
      >
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
    
    <!-- AI 生成任務模態框 -->
    <AiTaskModal
      :show="showAiModal"
      :target-list-id="targetListId"
      @close="showAiModal = false"
      @generation-start="onAiGenerationStart"
      @generation-complete="onAiGenerationComplete"
    />

    <!-- 📱 Mobile Undo Toast 通知 -->
    <UndoToast
      :visible="undoState.toastState.visible"
      :message="undoState.toastState.message"
      @undo="handleUndo"
      @close="handleToastClose"
    />
  </div>
</template>

<script setup lang="ts">
// #region ═══════════════════════ 📦 IMPORTS ═══════════════════════
import { ref, nextTick, onMounted, onUnmounted, watch, provide } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import AiTaskModal from '@/components/AiTaskModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import UndoToast from '@/components/UndoToast.vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useBoardCommon } from '@/composables/useBoardCommon'
import { useBoardView } from '@/composables/useBoardView'
import { useCardOperations } from '@/composables/useCardOperations'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useInlineEdit } from '@/composables/useInlineEdit'
import { useUndo } from '@/composables/useUndo'
import { useGesture } from '@vueuse/gesture'
import { useBoardStore } from '@/stores/boardStore'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'
import { eventBus } from '@/events/EventBus'

// #endregion ═══════════════════════ 📦 IMPORTS ═══════════════════════

// #region ═══════════════════════ 🎯 COMPOSABLES & SETUP ═══════════════════════
// 📱 手機版：使用共用的看板邏輯
const {
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
  deleteList: deleteListAction,
  updateListTitle: updateListTitleAction,
  
  // 卡片管理
  openCardModal,
  closeCardModal,
  deleteCard: deleteCardAction,
  updateCardTitle: updateCardTitleAction,
  addCard: addCardAction,
  
  // AI 功能
  openAiModal,
  onAiGenerationStart: handleAiGenerationStart,
  onAiGenerationComplete: handleAiGenerationComplete,
  
  // 拖拽功能
  onDragStart,
  onDragEnd,
  onListMove
} = useBoardCommon()

// 使用專用的操作 composables
const { handleCardDelete, handleCardUpdateTitle, handleCardAdd } = useCardOperations()
const { handleCardDragMove, handleListDragMove } = useDragAndDrop()

// 需要單獨引入來處理手機版特有的拖拽邏輯
const { handleCardMove, handleListMove } = useBoardView()

// 🔄 Undo 復原系統
const undoState = useUndo()
const boardStore = useBoardStore()

// 🔄 創建整合 undo 系統的刪除函數
const deleteCardWithUndo = async (card: CardUI) => {
  console.log('🔥📱 [MOBILE-BOARD] deleteCardWithUndo 被呼叫!', {
    cardTitle: card.title,
    cardId: card.id,
    cardType: typeof card
  })
  
  try {
    console.log('🔥📱 [MOBILE-BOARD] 開始呼叫 handleCardDelete...')
    
    // 使用 useCardOperations 處理刪除邏輯
    const deleteInfo = await handleCardDelete(card)
    
    console.log('🔥📱 [MOBILE-BOARD] handleCardDelete 回傳:', deleteInfo)
    
    if (deleteInfo) {
      console.log('🔥📱 [MOBILE-BOARD] 開始呼叫 softDeleteCard...')
      console.log('🔥📱 [MOBILE-BOARD] undoState:', undoState)
      console.log('🔥📱 [MOBILE-BOARD] undoState.toastState:', undoState.toastState)
      // 使用當前組件的 undo 狀態處理軟刪除
      undoState.softDeleteCard(deleteInfo.card, deleteInfo.listId, deleteInfo.position)
      console.log('🔥📱 [MOBILE-BOARD] 軟刪除完成，toast 狀態:', undoState.toastState)
      console.log('✅ [MOBILE-BOARD] 卡片已軟刪除，toast 應該已顯示')
    } else {
      console.error('❌ [MOBILE-BOARD] deleteInfo 為空，無法執行軟刪除')
    }
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 卡片刪除失敗:', error)
  }
}

// 🔌 Provide/Inject - 提供給子組件使用的方法
// 使用統一的 key 讓 Card 組件能夠注入
provide('deleteCard', deleteCardWithUndo)
// #endregion ═══════════════════════ 🎯 COMPOSABLES & SETUP ═══════════════════════

// #region ═══════════════════════ 📱 MOBILE SPECIFIC STATE ═══════════════════════
// 看板容器的 DOM 引用
const boardContainerRef = ref<HTMLElement | null>(null)
const mobileListsContainer = ref<HTMLElement | null>(null)

// 🎯 簡化方案：移除複雜的字體縮放和瀏覽器偵測
// 接受合理限制，提供穩定的使用者體驗

// 🔄 列表拖曳模式狀態
// 💡 十歲小朋友解釋：這個開關決定你是「滑動看列表」還是「拖動換位置」
const isListDragMode = ref(false)

// 🔄 切換列表拖曳模式
const toggleListDragMode = () => {
  isListDragMode.value = !isListDragMode.value
  console.log(`📱 [MOBILE] 切換到${isListDragMode.value ? '排序' : '滑動'}模式`)
}

// 📱 手機版長按 + 拖拽系統
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)
const cardLongPressMode = ref(false)
const isDraggingDisabled = ref(true)  // 是否禁用拖拽（預設禁用）

// 📋 手機版列表切換系統
const isListSnapping = ref(false)

// #endregion ═══════════════════════ 📱 MOBILE SPECIFIC STATE ═══════════════════════

// #region ═══════════════════════ 🎮 GESTURE HANDLING ═══════════════════════
// 🧹 清理函數存儲
const cleanupFunctions = ref<(() => void)[]>([])

// 🎯 進階手機手勢初始化（整合自 TrelloBoard）
const setupMobileGestures = () => {
  if (!mobileListsContainer.value) {
    console.error('❌ [MOBILE-BOARD] 無法初始化：mobileListsContainer 不存在')
    return
  }
  
  const container = mobileListsContainer.value
  console.log('📱 [MOBILE-BOARD] 初始化手機版手勢系統')
  
  // 🎯 只處理非拖拽區域的列表切換手勢
  let startX = 0
  let isListGesture = false
  
  const handleListTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement
    
    // 檢查是否在卡片拖拽區域
    if (target.closest('.card-draggable') || 
        target.closest('draggable') || 
        target.closest('[draggable="true"]')) {
      return
    }
    
    const touch = e.touches[0]
    startX = touch.clientX
    isListGesture = false
  }
  
  const handleListTouchMove = (e: TouchEvent) => {
    if (!mobileListsContainer.value) return
    
    const target = e.target as HTMLElement
    
    if (target.closest('.card-draggable') || 
        target.closest('draggable') ||
        target.closest('[draggable="true"]')) {
      return
    }
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX
    
    if (Math.abs(deltaX) > 15 && !isListGesture) {
      isListGesture = true
      e.preventDefault()
      console.log('📋 [MOBILE-GESTURE] 列表切換手勢觸發')
    }
  }
  
  const handleListTouchEnd = () => {
    if (isListGesture && mobileListsContainer.value) {
      handleMobileListSnapBack()
    }
    isListGesture = false
  }
  
  // 綁定事件監聽器
  container.addEventListener('touchstart', handleListTouchStart, { passive: true })
  container.addEventListener('touchmove', handleListTouchMove, { passive: false })
  container.addEventListener('touchend', handleListTouchEnd, { passive: true })
  
  // 🧹 存儲清理函數，防止記憶體洩漏
  cleanupFunctions.value.push(() => {
    if (container) {
      container.removeEventListener('touchstart', handleListTouchStart)
      container.removeEventListener('touchmove', handleListTouchMove)
      container.removeEventListener('touchend', handleListTouchEnd)
      console.log('🧹 [MOBILE-BOARD] 手機版手勢事件監聽器已清理')
    }
  })
  
  console.log('📱 [MOBILE-BOARD] 手勢系統已初始化')
}

// 🎯 手機版列表智慧對齊 - 滑動後自動對齊到最近的列表中心
const handleMobileListSnapBack = () => {
  if (!mobileListsContainer.value || isListSnapping.value) return
  
  isListSnapping.value = true
  const container = mobileListsContainer.value
  
  // 取得第一個列表元素計算寬度
  const firstList = container.querySelector('.mobile-list-item') as HTMLElement
  const listWidth = firstList ? firstList.offsetWidth + 16 : 320
  
  // 計算滾動位置
  
  // 找出最接近螢幕中心的列表
  const currentScroll = container.scrollLeft
  const containerWidth = container.clientWidth
  const screenCenter = currentScroll + containerWidth / 2
  
  let closestListIndex = 0
  let minDistance = Infinity
  
  viewData.value.lists.forEach((_, index) => {
    const listCenterX = index * listWidth + listWidth / 2
    const distance = Math.abs(listCenterX - screenCenter)
    if (distance < minDistance) {
      minDistance = distance
      closestListIndex = index
    }
  })
  
  // 計算目標滾動位置
  const targetScroll = closestListIndex * listWidth + (listWidth - containerWidth) / 2
  
  // 滾動到目標位置
  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
  
  // 震動回饋
  if (Math.abs(targetScroll - currentScroll) > 10 && navigator.vibrate) {
    navigator.vibrate(30)
  }
  
  // 重設彈性狀態
  setTimeout(() => {
    isListSnapping.value = false
  }, 500)
}

// 🎯 使用 @vueuse/gesture 處理長按手勢
const setupAdvancedGestures = () => {
  if (!boardContainerRef.value) {
    console.error('❌ [MOBILE-BOARD] 無法初始化手勢：容器不存在')
    return
  }
  
  console.log('📱 [MOBILE-BOARD] 初始化進階手勢系統')
  
  // 🚫 禁用右鍵選單，防止長按時出現 context menu
  const handleContextMenu = (e: Event) => {
    e.preventDefault()
    return false
  }
  
  boardContainerRef.value.addEventListener('contextmenu', handleContextMenu, { passive: false })
  
  // 存儲清理函數以便組件卸載時使用
  cleanupFunctions.value.push(() => {
    boardContainerRef.value?.removeEventListener('contextmenu', handleContextMenu)
  })
  
  useGesture({
    onDragStart: () => {
      console.log('🔋 [MOBILE-GESTURE] 開始觸控')
      isLongPressing.value = false
      cardLongPressMode.value = false
      isDraggingDisabled.value = true
      
      // 設定 0.75 秒計時器
      longPressTimer.value = window.setTimeout(() => {
        console.log('⏰ [MOBILE-GESTURE] 長按 0.75 秒達成！進入卡片拖拽模式')
        isLongPressing.value = true
        cardLongPressMode.value = true
        isDraggingDisabled.value = false  // 啟用拖拽
        
        // 震動回饋
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }, 750)
    },
    
    onDrag: ({ movement, velocity }) => {
      const [mx, my] = movement as [number, number]
      const vx = (Array.isArray(velocity) ? velocity[0] : 0) ?? 0
      
      // 卡片拖拽模式
      if (cardLongPressMode.value) {
        console.log('📦 [MOBILE-GESTURE] 卡片拖拽模式:', { mx, my })
        return
      }
      
      // 列表切換模式
      if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 30) {
        console.log('📋 [MOBILE-GESTURE] 列表水平切換:', { mx, vx })
        // 列表滑動由 setupMobileGestures 處理
      }
    },
    
    onDragEnd: ({ movement }) => {
      const [mx] = movement as [number, number]
      console.log('🏁 [MOBILE-GESTURE] 觸控結束')
      
      // 清除計時器
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
      
      // 處理列表彈性滾動
      if (!cardLongPressMode.value && Math.abs(mx) > 50) {
        handleMobileListSnapBack()
      }
      
      // 重設狀態
      isLongPressing.value = false
      cardLongPressMode.value = false
      isDraggingDisabled.value = true
    }
  }, {
    domTarget: boardContainerRef,
    drag: {
      threshold: 5
    }
  })
}

// 拖拽事件已由 useBoardCommon 提供

// 處理卡片拖拽移動事件
const onCardMove = async (event: any) => {
  console.log('📱 [MOBILE-BOARD] Card move event:', event)
  
  if (event.moved) {
    const { element: card } = event.moved
    let currentListId = null
    for (const list of viewData.value.lists) {
      if (list.cards.find(c => c.id === card.id)) {
        currentListId = list.id
        break
      }
    }
    
    if (currentListId) {
      await handleCardMove([currentListId])
      console.log('✅ [MOBILE-BOARD] 同列表移動處理完成')
    }
  }
  
  if (event.removed) {
    const { element: card } = event.removed
    let targetListId = null
    for (const list of viewData.value.lists) {
      if (list.cards.find(c => c.id === card.id)) {
        targetListId = list.id
        break
      }
    }
    
    if (targetListId) {
      await handleCardMove([targetListId])
      console.log('✅ [MOBILE-BOARD] 跨列表移動處理完成')
    }
  }
}
// #endregion ═══════════════════════ 🔄 EVENT HANDLERS ═══════════════════════

// #region ═══════════════════════ 🗑️ CRUD OPERATIONS ═══════════════════════
// 🗑️ 卡片刪除 - 現在透過 Provide/Inject 處理，不需要事件處理器

// ✏️ 卡片標題更新 - 樂觀更新策略  
// ✏️ 卡片標題更新 - 使用共用的卡片操作
const onCardUpdateTitle = handleCardUpdateTitle

// 📌 新增卡片 - 手機版樂觀更新
const onListAddCard = async (listId: string, title: string) => {
  console.log('📌 [MOBILE-BOARD] 新增卡片:', { listId, title })
  
  try {
    // 手機版也使用樂觀更新，但處理錯誤
    // 不傳遞 status，讓它使用預設值
    await addCardAction(listId, title)
    console.log('✅ [MOBILE-BOARD] 卡片新增完成')
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 新增卡片失敗:', error)
    eventBus.emit('notification:error', {
      title: '新增失敗',
      message: '新增卡片失敗，請檢查網路連線後再試',
      duration: 5000
    })
  }
}

// 🗑️ 列表刪除 - 需要確認的重要操作
const onListDelete = async (listId: string) => {
  console.log('🗑️ [MOBILE-BOARD] 刪除列表:', listId)
  
  try {
    // 刪除操作用戶需要明確的結果反饋
    await deleteListAction(listId)
    console.log('✅ [MOBILE-BOARD] 列表刪除成功')
    // 可以顯示成功提示
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 列表刪除失敗:', error)
    eventBus.emit('notification:error', {
      title: '刪除失敗',
      message: '刪除失敗，請稍後再試',
      duration: 5000
    })
  }
}

// ✏️ 列表標題更新 - 樂觀更新策略
const onListUpdateTitle = async (listId: string, newTitle: string) => {
  console.log('✏️ [MOBILE-BOARD] 更新列表標題:', { listId, newTitle })
  
  // 🚀 樂觀更新：不等待，讓用戶感覺超快
  // Store 內部已經實現了樂觀更新 + 失敗回滾
  updateListTitleAction(listId, newTitle).catch(error => {
    console.error('❌ [MOBILE-BOARD] 列表標題更新失敗:', error)
    // 錯誤已在 Store 層處理回滾，這裡只需要記錄
  })
  
  console.log('⚡ [MOBILE-BOARD] 列表標題樂觀更新完成')
}
// #endregion ═══════════════════════ 🗑️ CRUD OPERATIONS ═══════════════════════

// #region ═══════════════════════ 🤖 AI FUNCTIONS ═══════════════════════
// 🤖 AI 生成狀態
const aiGeneratingListId = ref<string | null>(null)

// 使用共用的 AI 生成函數，但需要管理本地狀態
const onAiGenerate = (listId: string) => {
  console.log('🤖 [MOBILE-BOARD] 開啟 AI 生成模態框，目標列表:', listId)
  openAiModal(listId)
}

const onAiGenerationStart = (listId: string) => {
  console.log('🌈 [MOBILE-BOARD] AI 開始生成，列表:', listId)
  aiGeneratingListId.value = listId
  handleAiGenerationStart()
}

const onAiGenerationComplete = () => {
  console.log('✅ [MOBILE-BOARD] AI 生成完成，清除狀態')
  aiGeneratingListId.value = null
  handleAiGenerationComplete()
}
// #endregion ═══════════════════════ 🤖 AI FUNCTIONS ═══════════════════════

// #region ═══════════════════════ 🔄 UNDO FUNCTIONS ═══════════════════════
// 🔄 復原已刪除的卡片
const handleUndo = () => {
  console.log('🔄 [MOBILE-BOARD] 用戶點擊復原按鈕')
  
  const itemId = undoState.toastState.itemId
  if (!itemId) {
    console.error('❌ [MOBILE-BOARD] 沒有找到要復原的項目 ID')
    return
  }
  
  // 從 undo 系統復原項目
  const deletedItem = undoState.undoDelete(itemId)
  if (!deletedItem) {
    console.error('❌ [MOBILE-BOARD] 復原失敗，找不到刪除的項目')
    return
  }
  
  // 將卡片還原到原始位置
  const { data: card, restoreInfo } = deletedItem
  const targetList = boardStore.board.lists.find(list => list.id === restoreInfo.listId)
  
  if (targetList) {
    // 將卡片插入到原始位置
    targetList.cards.splice(restoreInfo.position, 0, card)
    console.log('✅ [MOBILE-BOARD] 卡片已復原到原始位置:', {
      cardTitle: card.title,
      listTitle: targetList.title,
      position: restoreInfo.position
    })
  } else {
    console.error('❌ [MOBILE-BOARD] 找不到目標列表:', restoreInfo.listId)
  }
}

// 🙈 關閉 Toast 通知
const handleToastClose = () => {
  console.log('🙈 [MOBILE-BOARD] 關閉 Toast 通知')
  undoState.hideToast()
}
// #endregion ═══════════════════════ 🔄 UNDO FUNCTIONS ═══════════════════════

// #region ═══════════════════════ 🔄 LIFECYCLE HOOKS ═══════════════════════
// 初始化 - 只處理基本手勢，避免重複初始化列表手勢
onMounted(async () => {
  console.log('📱 [MOBILE-BOARD] 組件初始化')
  
  // 🚫 不重複載入資料，由上層 TrelloBoard 負責
  
  // 🎯 簡化初始化：移除字體偵測
  
  // 🎯 只初始化基本手勢系統（長按、contextmenu 等）
  // 列表手勢由 watcher 負責，避免重複初始化
  setupAdvancedGestures()
  console.log('📱 [MOBILE-BOARD] 基本手勢系統已初始化，等待列表數據載入...')
})

// 🎯 監聽資料載入完成後初始化列表手勢
// 
// 📋 為什麼不用 immediate: true？
// - immediate 可能在 DOM 未就緒時執行，導致 mobileListsContainer.value 為 null
// - 我們需要確保容器元素已經存在才能綁定事件監聽器
//
// 🔒 雙重檢查確保安全：
// - newLength > 0：確保有列表數據
// - mobileListsContainer.value：確保 DOM 容器已就緒
// - nextTick：確保 Vue 的 DOM 更新完成
watch(() => viewData.value.lists.length, (newLength) => {
  if (newLength > 0 && mobileListsContainer.value) {
    nextTick(() => {
      setupMobileGestures()
    })
  }
})

// 🧹 組件卸載時清理事件監聽器
onUnmounted(() => {
  console.log('📱 [MOBILE-BOARD] 組件卸載，清理事件監聽器')
  cleanupFunctions.value.forEach(cleanup => cleanup())
  cleanupFunctions.value = []
})
// #endregion ═══════════════════════ 🔄 LIFECYCLE HOOKS ═══════════════════════
</script>

<style scoped>
/* 📱 手機版列表拖曳樣式 */
/* 💡 十歲小朋友解釋：這些是列表拖曳時的魔法效果！ */

/* 🎭 正在被拖曳的列表 */
.mobile-list-drag {
  opacity: 0.8;
  transform: scale(0.95);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* 👻 列表的幽靈位置 */  
.mobile-list-ghost {
  opacity: 0.3;
  background: #e5e7eb;
  border: 2px dashed #9ca3af;
}

/* ✨ 被選中的列表 */
.mobile-list-chosen {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transform: scale(1.02);
}

/* 🎯 拖曳把手樣式 */
.list-drag-handle {
  touch-action: none; /* 防止瀏覽器處理觸控 */
  user-select: none; /* 防止選取文字 */
}

/* 📱 列表包裝器 */
.mobile-list-wrapper {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
</style>

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

/* 防止拖拽時選取文字 - 已在模板中處理 */

/* 📱 手機版容器樣式 */
.mobile-container {
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
  /* 🚫 防止長按時出現右鍵選單和選取文字 */
  -webkit-touch-callout: none; /* iOS Safari 防止長按彈出選單 */
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.mobile-list-item {
  /* 🎯 簡化 CSS 寬度計算，支援到「大一級」字體 */
  width: calc(100vw - 2rem);
  min-width: 280px; /* 確保小螢幕可讀性 */
  max-width: 380px; /* 限制最大寬度，支援到「大一級」字體 */
  flex-shrink: 0;
  scroll-snap-align: center;
  box-sizing: border-box;
}

/* 🎯 使用者友善提示：建議使用「標準」或「大一級」字體大小以獲得最佳體驗 */

/* 📱 手機版卡片拖拽樣式 - 簡化版 */

/* 🎯 手機版拖拽類別樣式 - 對應 ListItem 設定的 mobile-drag */
:deep(.mobile-drag) {
  transform: scale(1.1) rotate(-3deg) !important;
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4) !important;
  opacity: 0.75 !important;
  z-index: 10000 !important;
  border: 3px solid #3b82f6 !important;
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important;
  cursor: grabbing !important;
  pointer-events: none !important;
  position: fixed !important; /* 🔑 關鍵：固定定位跟隨手指 */
}

/* 🔧 手機版 Fallback 樣式 - 當使用 force-fallback 時（跟桌面版一樣） */
:deep(.sortable-fallback) {
  transform: scale(1.1) rotate(-3deg) !important;
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4) !important;
  opacity: 0.8 !important; /* 跟桌面版一樣 */
  z-index: 99999 !important;
  border: 3px solid #3b82f6 !important;
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important;
  cursor: grabbing !important;
  pointer-events: none !important;
  position: fixed !important; /* 🔑 關鍵：固定定位跟隨手指 */
}

:deep(.mobile-ghost) {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  border: 2px dashed #22c55e !important;
  opacity: 0.6 !important;
  transform: scale(0.95) !important;
  transition: all 0.2s ease !important;
}

/* 📱 手機版樣式已整合到 ListItem.vue，移除重複定義 */

/* 響應式間距 */
@media (max-width: 768px) {
  .mobile-container {
    padding: 1rem;
    gap: 1.5rem;
  }
}
</style>