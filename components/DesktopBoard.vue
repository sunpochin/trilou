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
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
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
import { ref, nextTick } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'

// 使用統一的卡片型別定義
type Card = CardUI

// 🖥️ 桌面版：使用 vue-draggable-next 處理所有拖拽
const { addList } = useListActions()
const { viewData, handleCardMove, handleListMove, findListById, getAllListIds } = useBoardView()

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 新增列表狀態管理
const isAddingList = ref(false)
const newListTitle = ref('')
const newListInput = ref<HTMLInputElement | null>(null)

// 🖥️ 桌面版不需要檢測螢幕尺寸

// 處理卡片拖拉移動事件
const onCardMove = async (event: any) => {
  console.log('📦 [COMPONENT] Card moved event:', event)
  
  // 處理卡片被新增到列表的情況（從其他列表移動過來）
  if (event.added) {
    console.log('🔄 [COMPONENT] 卡片被新增到列表:', event.added)
    // 🎯 跨列表移動會觸發兩個事件：removed + added
    // 我們需要等 removed 事件處理完成，才處理 added
    // 但這裡可以先記錄，實際的 moveCard 邏輯交給 removed 事件處理
    console.log('📝 [COMPONENT] 跨列表移動的 added 事件，由 removed 事件統一處理')
  }
  
  // 處理卡片在同一列表內移動的情況
  if (event.moved) {
    console.log('🔄 [COMPONENT] 卡片在列表內移動:', event.moved)
    const { element: card } = event.moved
    
    // 🎯 找到卡片所在的列表（使用抽象方法）
    let currentListId = null
    for (const list of viewData.lists) {
      const foundCard = list.cards.find(c => c.id === card.id)
      if (foundCard) {
        currentListId = list.id
        break
      }
    }
    
    if (currentListId) {
      try {
        console.log(`🚀 [COMPONENT] 同一列表內移動，重新整理列表 ${currentListId} 的位置`)
        // ✅ Vue Draggable 已經更新了 UI，我們只需要重新排序 position
        await handleCardMove([currentListId])
        console.log('✅ [COMPONENT] 成功更新列表內卡片位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 更新卡片位置失敗:', error)
        // 可選：重新載入資料以確保一致性
        // await boardStore.fetchBoard()
      }
    }
  }
  
  // 處理卡片從列表移除的情況（跨列表移動）
  if (event.removed) {
    console.log('📤 [COMPONENT] 卡片從列表被移除（跨列表移動）:', event.removed)
    const { element: card } = event.removed
    
    // 🎯 找到卡片現在在哪個列表中（Vue Draggable 已經移動了）
    let targetListId = null
    for (const list of viewData.lists) {
      const foundCard = list.cards.find(c => c.id === card.id)
      if (foundCard) {
        targetListId = list.id
        break
      }
    }
    
    // 🔧 改良版：多重方式嘗試找到原來的列表 ID
    let sourceListId = null
    
    // 方法 1：嘗試從 DOM 元素獲取
    if (event.from) {
      const sourceContainer = event.from.closest('[data-list-id]')
      if (sourceContainer) {
        sourceListId = sourceContainer.getAttribute('data-list-id')
        console.log('✅ [COMPONENT] 方法1成功獲取 sourceListId:', sourceListId)
      }
    }
    
    // 方法 2：如果方法1失敗，使用排除法推算
    if (!sourceListId && targetListId) {
      console.log('⚠️ [COMPONENT] 方法1失敗，嘗試方法2：排除法推算 sourceListId')
      // 假設只有兩個列表發生變化，找出不是 targetListId 的那個
      for (const list of viewData.lists) {
        if (list.id !== targetListId) {
          // 檢查這個列表是否有位置變化（表示有卡片被移出）
          const hasGaps = list.cards.some((c, index) => c.position !== undefined && c.position !== index)
          if (hasGaps) {
            sourceListId = list.id
            console.log('✅ [COMPONENT] 方法2推算出 sourceListId:', sourceListId)
            break
          }
        }
      }
    }
    
    // 方法 3：如果前兩種方法都失敗，重新整理所有列表
    if (!sourceListId && targetListId) {
      console.log('⚠️ [COMPONENT] 方法1和2都失敗，使用方法3：重新整理所有列表')
      try {
        const allListIds = getAllListIds()
        await handleCardMove(allListIds)
        console.log('✅ [COMPONENT] 方法3：成功重新整理所有列表位置')
        return // 早期返回，避免重複執行
      } catch (error) {
        console.error('❌ [COMPONENT] 方法3失敗:', error)
      }
    }
    
    // 🎯 執行跨列表移動邏輯
    if (targetListId) {
      // 只要能識別到 targetListId，就執行更新
      const listsToUpdate = sourceListId ? [sourceListId, targetListId] : [targetListId]
      
      try {
        console.log(`🚀 [COMPONENT] 跨列表移動：${sourceListId || '未知'} → ${targetListId}`)
        console.log(`📋 [COMPONENT] 需要更新的列表:`, listsToUpdate)
        
        await handleCardMove(listsToUpdate)
        console.log('✅ [COMPONENT] 成功完成跨列表移動並重新整理位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 跨列表移動失敗:', error)
        // 🔄 最後的恢復策略：重新載入資料確保一致性
        console.log('🔄 [COMPONENT] 嘗試重新載入看板資料...')
        // 可以選擇是否重新載入（可能會影響用戶體驗）
        // await boardStore.fetchBoard()
      }
    } else {
      console.warn('⚠️ [COMPONENT] 無法識別 targetListId，跳過跨列表移動處理')
      console.log('📊 [COMPONENT] 當前看板狀態:', {
        listsCount: viewData.listsCount,
        cardId: card.id,
        cardTitle: card.title
      })
    }
  }
}

// 處理列表拖拉移動事件
const onListMove = async (event: any) => {
  console.log('📋 [COMPONENT] List moved event:', event)
  
  // 🎯 Vue Draggable 的 :list 屬性會自動修改 viewData.lists 陣列順序
  // 這就是為什麼 UI 立即更新的原因！
  
  // 但是我們需要將新的順序保存到資料庫
  if (event.moved) {
    console.log('🔄 [COMPONENT] 列表在看板內移動:', event.moved)
    
    try {
      // 🎯 委派給 Store 處理：符合 SRP (單一職責原則)
      // 組件只負責佈局協調，資料儲存由 Store 負責
      console.log('💾 [COMPONENT] 委派保存列表順序到 Store...')
      await handleListMove()
      console.log('✅ [COMPONENT] 列表位置已更新')
      
    } catch (error) {
      console.error('❌ [COMPONENT] 更新列表順序失敗:', error)
      // 可選：重新載入資料以確保一致性
      // await boardStore.fetchBoard()
    }
  }
}

// 在組件載入時記錄 lists 的數量
console.log('🖼️ [COMPONENT] TrelloBoard 載入，目前 lists 數量:', viewData.listsCount)
console.log('🖼️ [COMPONENT] TrelloBoard 使用依賴反轉原則，透過 composable 訪問資料')

// 處理新增列表（舊的 modal 方式，保留以備後用）
const handleAddList = () => {
  addList()
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

// 🖥️ 桌面版組件載入完成
console.log('🖥️ [DESKTOP-BOARD] 桌面版看板載入完成')
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

/* 列表拖拽樣式 */
:deep(.list-ghost) {
  background: #e2e8f0 !important;
  border: 2px dashed #64748b !important;
  border-radius: 8px !important;
  opacity: 0.6 !important;
}

:deep(.list-chosen) {
  opacity: 0.8 !important;
}

:deep(.list-dragging) {
  transform: rotate(3deg) scale(1.02) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
  transition: all 0.2s ease-out !important;
}

/* 防止拖拽時選取文字 */
:global(.card-draggable) {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
