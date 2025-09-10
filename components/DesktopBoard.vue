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
    :class="[
      'w-full p-4 h-[85vh] overflow-x-auto bg-gray-100 font-sans',
      viewData.isLoading ? 'flex items-center justify-center' : 'flex gap-4'
    ]"
    @contextmenu.prevent
    @selectstart.prevent
  >
    
    <!-- 載入狀態：顯示 loading spinner -->
    <div v-if="viewData.isLoading" class="text-center">
      <SkeletonLoader 
        size="lg" 
        :text="MESSAGES.board.loadingFromCloud"
        color="#3B82F6"
        :animate="true"
      />
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
          :ai-generating-list-id="aiGeneratingListId"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
          @card-delete="onCardDelete"
          @card-update-title="onCardUpdateTitle"
          @list-add-card="onListAddCard"
          @list-delete="onListDelete"
          @list-update-title="onListUpdateTitle"
          @ai-generate="onAiGenerate"
        />
      </draggable>

      <!-- 新增列表區域 - 桌面版固定寬度 -->
      <div class="w-80 p-2 flex-shrink-0 space-y-2">
        <!-- 測試 Toast 按鈕 -->
        <!-- <div class="bg-purple-100 rounded p-2 border border-purple-200">
          <p class="text-xs text-purple-600 mb-1">🧪 測試 Toast 通知</p>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <button 
              @click="testToast('success')"
              class="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              成功
            </button>
            <button 
              @click="testToast('error')"
              class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              錯誤
            </button>
            <button 
              @click="testToast('info')"
              class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              資訊
            </button>
            <button 
              @click="testToast('warning')"
              class="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              警告
            </button>
          </div>
        </div> -->

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
  </div>
</template>

<script setup lang="ts">
// #region ═══════════════════════ 📦 IMPORTS & TYPES ═══════════════════════
// 📦 Vue 核心功能
import { ref, nextTick, onMounted } from 'vue'

// 🏠 組件引入
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import AiTaskModal from '@/components/AiTaskModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'

// 🔌 第三方函庫
import { VueDraggableNext as draggable } from 'vue-draggable-next'

// 🔧 Composables 引入
import { useBoardCommon } from '@/composables/useBoardCommon'
import { useBoardView } from '@/composables/useBoardView'
import { useCardOperations } from '@/composables/useCardOperations'
import { useDragAndDrop, type DragEvent } from '@/composables/useDragAndDrop'

// 📊 型別定義
import type { CardUI } from '@/types'

// 💬 常數和事件
import { MESSAGES } from '@/constants/messages'
import { eventBus } from '@/events/EventBus'


// #endregion ═══════════════════════ 📦 IMPORTS & TYPES ═══════════════════════

// #region ═══════════════════════ 🎮 COMPOSABLES & SETUP ═══════════════════════
// 🖥️ 桌面版主要 Composable 設定
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
  onDragEnd
} = useBoardCommon()

// 📋 特定操作 Composables
const { handleCardDelete, handleCardUpdateTitle, handleCardAdd } = useCardOperations()
const { handleCardDragMove, handleListDragMove } = useDragAndDrop()
const { handleCardMove, handleListMove } = useBoardView()

// 🤖 AI 生成狀態
const aiGeneratingListId = ref<string | null>(null)
// #endregion ═══════════════════════ 🎮 COMPOSABLES & SETUP ═══════════════════════

// #region ═══════════════════════ 🔄 DRAG & DROP HANDLERS ═══════════════════════
// 🖥️ 卡片拖拽事件處理
const onCardMove = async (event: DragEvent) => {
  console.log('🖥️ [DESKTOP-DRAG] 卡片移動事件:', event)
  
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
      if (list.cards.find(c => c.id === card.id)) {
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

// 🖥️ 列表拖拽事件處理
const onListMove = async (event: DragEvent) => {
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
// #endregion ═══════════════════════ 🔄 DRAG & DROP HANDLERS ═══════════════════════

// #region ═══════════════════════ 🗑️ CRUD OPERATIONS ═══════════════════════
/**
 * 🖥️ 桌面版樂觀更新系統 - 與手機版相同的強大體驗！
 * 
 * 🎯 智慧策略分類：
 * - 🗑️ 刪除操作：需要確認 + 等待結果（不可逆）
 * - ✏️ 編輯操作：樂觀更新（快速體驗）
 * - 📌 新增操作：樂觀更新 + 錯誤處理
 */

// 🗑️ 卡片刪除 - 需要確認的重要操作
const onCardDelete = async (card: CardUI) => {
  console.log('🗑️ [DESKTOP-BOARD] 刪除卡片:', card.title)
  
  try {
    // 刪除是重要操作，用戶需要知道結果
    await deleteCardAction(card)
    console.log('✅ [DESKTOP-BOARD] 卡片刪除成功')
  } catch (error) {
    console.error('❌ [DESKTOP-BOARD] 卡片刪除失敗:', error)
    eventBus.emit('notification:error', {
      title: '刪除失敗',
      message: '刪除失敗，請稍後再試',
      duration: 5000
    })
  }
}

// ✏️ 卡片標題更新 - 桌面版樂觀更新
const onCardUpdateTitle = async (cardId: string, newTitle: string) => {
  console.log('✏️ [DESKTOP-BOARD] 更新卡片標題:', { cardId, newTitle })
  
  // 🚀 桌面版也享受樂觀更新的快速體驗
  updateCardTitleAction(cardId, newTitle).catch(error => {
    console.error('❌ [DESKTOP-BOARD] 卡片標題更新失敗:', error)
    // Store 層已處理回滾
  })
  
  console.log('⚡ [DESKTOP-BOARD] 卡片標題樂觀更新完成')
}

// 📌 新增卡片 - 桌面版樂觀更新
const onListAddCard = async (listId: string, title: string) => {
  console.log('📌 [DESKTOP-BOARD] 新增卡片:', { listId, title })
  
  try {
    // 桌面版也使用樂觀更新，但處理錯誤
    // 不傳遞 status，讓它使用預設值
    await addCardAction(listId, title)
    console.log('✅ [DESKTOP-BOARD] 卡片新增完成')
  } catch (error) {
    console.error('❌ [DESKTOP-BOARD] 新增卡片失敗:', error)
    eventBus.emit('notification:error', {
      title: '新增失敗',
      message: '新增卡片失敗，請檢查網路連線後再試',
      duration: 5000
    })
  }
}

// 🗑️ 列表刪除 - 需要確認的重要操作
const onListDelete = async (listId: string) => {
  console.log('🗑️ [DESKTOP-BOARD] 刪除列表:', listId)
  
  try {
    await deleteListAction(listId)
    console.log('✅ [DESKTOP-BOARD] 列表刪除成功')
  } catch (error) {
    console.error('❌ [DESKTOP-BOARD] 列表刪除失敗:', error)
    eventBus.emit('notification:error', {
      title: '刪除失敗',
      message: '刪除失敗，請稍後再試',
      duration: 5000
    })
  }
}

// ✏️ 列表標題更新 - 桌面版樂觀更新
const onListUpdateTitle = async (listId: string, newTitle: string) => {
  console.log('✏️ [DESKTOP-BOARD] 更新列表標題:', { listId, newTitle })
  
  updateListTitleAction(listId, newTitle).catch(error => {
    console.error('❌ [DESKTOP-BOARD] 列表標題更新失敗:', error)
  })
  
  console.log('⚡ [DESKTOP-BOARD] 列表標題樂觀更新完成')
}
// #endregion ═══════════════════════ 🗑️ CRUD OPERATIONS ═══════════════════════

// 使用共用的 AI 生成函數，但需要管理本地狀態
const onAiGenerate = (listId: string) => {
  console.log('🤖 [DESKTOP-BOARD] 開啟 AI 生成模態框，目標列表:', listId)
  openAiModal(listId)
}

const onAiGenerationStart = (listId: string) => {
  console.log('🌈 [DESKTOP-BOARD] AI 開始生成，列表:', listId)
  aiGeneratingListId.value = listId
  handleAiGenerationStart()
}

const onAiGenerationComplete = () => {
  console.log('✅ [DESKTOP-BOARD] AI 生成完成，清除狀態')
  aiGeneratingListId.value = null
  handleAiGenerationComplete()
}
// #endregion ═══════════════════════ 🤖 AI FUNCTIONS ═══════════════════════

// #region ═══════════════════════ 🧪 TESTING UTILITIES ═══════════════════════
// 🧪 測試 Toast 通知功能
const testToast = (type: 'success' | 'error' | 'info' | 'warning') => {
  const testMessages = {
    success: { title: '操作成功', message: '這是一個成功的 Toast 通知' },
    error: { title: '發生錯誤', message: '這是一個錯誤的 Toast 通知' },
    info: { title: '資訊通知', message: '這是一個資訊類型的 Toast 通知' },
    warning: { title: '警告提醒', message: '這是一個警告類型的 Toast 通知' }
  }

  const message = testMessages[type]
  
  if (type === 'success') {
    eventBus.emit('notification:show', {
      type: 'success',
      message: message.message
    })
  } else {
    eventBus.emit('notification:error', {
      title: message.title,
      message: message.message,
      duration: type === 'error' ? 5000 : 3000
    })
  }
  
  console.log(`🧪 [TEST-TOAST] 測試 ${type} 通知:`, message)
}
// #endregion ═══════════════════════ 🧪 TESTING UTILITIES ═══════════════════════

// #region ═══════════════════════ 🔧 LIFECYCLE HOOKS ═══════════════════════
// 🖥️ 桌面版組件初始化
onMounted(() => {
  console.log('🖥️ [DESKTOP-BOARD] 桌面版看板初始化完成')
})

// 在組件載入時記錄當前狀態
console.log('🖼️ [DESKTOP-BOARD] 桌面版專用看板載入')
console.log('🖼️ [DESKTOP-BOARD] 使用依賴反轉原則，透過 composable 訪問資料')
// #endregion ═══════════════════════ 🔧 LIFECYCLE HOOKS ═══════════════════════
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
  transform: scale(1.03) !important; /* 移除歪斜 */
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25) !important;
  z-index: 999 !important;
  border: 2px solid #10b981 !important;
  background: linear-gradient(135deg, #ffffff, #f0fdf4) !important;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
  cursor: grabbing !important;
}

/* 🎯 桌面版拖拽卡片 - 跟手機版保持一致的行為 */
:deep(.desktop-drag) {
  width: 320px !important; /* 固定寬度避免縮小 */
  transform: scale(1.05) !important; /* 移除歪斜，只保留放大 */
  box-shadow: 0 15px 40px rgba(59, 130, 246, 0.3) !important; /* 柔和的陰影 */
  opacity: 0.9 !important; /* 保持清晰可見 */
  z-index: 99999 !important; /* 最高層級 */
  border: 2px solid #3b82f6 !important; /* 適中的邊框 */
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important; /* 🔑 關鍵：無過渡動畫 */
  cursor: grabbing !important;
  pointer-events: none !important; /* 避免滑鼠事件干擾 */
  position: fixed !important; /* 🔑 關鍵：固定定位跟隨滑鼠 */
  border-radius: 8px !important; /* 保持圓角 */
}

</style>
