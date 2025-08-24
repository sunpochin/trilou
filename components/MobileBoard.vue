<!--
  📱 手機版看板組件 - 專為行動裝置優化
  
  功能特色：
  - 使用 vue-draggable-next 處理卡片拖拽
  - 支援列表左右滑動切換（snap-scroll）
  - 長按 0.75 秒啟動卡片拖拽模式
  - 整合 @vueuse/gesture 手勢控制
  - 完整的 CRUD 功能
-->

<template>
  <!-- 手機版看板容器 -->
  <div 
    ref="boardContainerRef"
    class="block overflow-y-auto mobile-container gap-4 p-4 h-[85vh] bg-gray-100 font-sans"
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
      <!-- 📱 手機版列表容器 - 支援彈性滾動 -->
      <div 
        class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory" 
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
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @card-delete="onCardDelete"
          @card-update-title="onCardUpdateTitle"
          @list-add-card="onListAddCard"
          @list-delete="onListDelete"
          @list-update-title="onListUpdateTitle"
          class="mobile-list-item snap-center"
        />
      </div>

      <!-- 新增列表區域 - 手機版全寬度 -->
      <div class="w-[calc(100vw-3rem)] mx-6 max-w-none p-2 flex-shrink-0">
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
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { useCardActions } from '@/composables/useCardActions'
import { useGesture } from '@vueuse/gesture'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'

// 使用統一的卡片型別定義
type Card = CardUI

// 📱 手機版：使用 composables
const { addList, deleteList: deleteListAction, updateListTitle: updateListTitleAction } = useListActions()
const { viewData, handleCardMove } = useBoardView()
const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction, addCard: addCardAction } = useCardActions()

// 看板容器的 DOM 引用
const boardContainerRef = ref<HTMLElement | null>(null)
const mobileListsContainer = ref<HTMLElement | null>(null)

// 拖拽狀態管理
const draggingState = ref({
  isDragging: false,
  draggedItem: null as any,
  dragType: null as 'card' | 'list' | null
})

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 新增列表狀態管理
const isAddingList = ref(false)
const newListTitle = ref('')
const newListInput = ref<HTMLInputElement | null>(null)
const isSavingList = ref(false)

// 📱 手機版長按 + 拖拽系統
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)
const cardLongPressMode = ref(false)
const isDraggingDisabled = ref(true)  // 是否禁用拖拽（預設禁用）

// 📋 手機版列表切換系統
const isListSnapping = ref(false)

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

/**
 * 🎮 手機版列表智慧對齊函式 - Trello 風格的彈性滾動
 * 
 * 📖 十歲小朋友也能懂的解釋：
 * 想像你有一排書架（列表），每個書架都一樣寬。
 * 當你用手指滑動看不同書架時，手指離開後：
 * - 系統會自動幫你「對齊」到最近的那個書架中間
 * - 就像磁鐵一樣，會吸到最近的書架！
 * - 這樣你就不會看到「半個書架」，總是看到完整的書架
 * 
 * 🔬 技術原理（程式設計師版本）：
 * 1. 【測量階段】計算每個列表的寬度和位置
 * 2. 【分析階段】找出螢幕中心最接近哪個列表的中心
 * 3. 【動作階段】使用 scrollTo() 平滑滑動到目標位置
 * 4. 【回饋階段】提供震動回饋讓使用者知道已對齊
 * 
 * 🎯 核心算法：
 * - screenCenter = currentScroll + containerWidth / 2  (螢幕中心位置)
 * - targetScroll = listIndex * listWidth + (listWidth - containerWidth) / 2  (目標滑動位置)
 * - 使用歐幾里得距離找最近的列表：Math.abs(listCenter - screenCenter)
 */
const handleMobileListSnapBack = () => {
  if (!mobileListsContainer.value || isListSnapping.value) return
  
  isListSnapping.value = true
  const container = mobileListsContainer.value
  
  // 🔍 尋找第一個列表元素（使用正確的選擇器）
  const firstList = container.querySelector('.mobile-list-item') as HTMLElement
  console.log('🔍 [尋找列表] 第一個列表元素:', firstList)
  
  // 🔍 如果找不到，嘗試其他可能的選擇器
  const actualList = firstList || container.querySelector('.bg-gray-200, [data-list-id]') as HTMLElement
  if (!firstList && actualList) {
    console.log('🔍 [備用尋找] 使用備用選擇器找到:', actualList)
  }
  
  // 📏 計算列表寬度（如果找不到就估算）
  const listWidth = actualList ? actualList.offsetWidth + 16 : 320 // 實際寬度 + gap 或預設 320px
  
  // 📊 詳細寬度資訊
  console.log('📏 [寬度計算]', {
    找到的元素: !!actualList,
    元素寬度: actualList?.offsetWidth,
    gap間距: 16,
    最終寬度: listWidth
  })
  
  console.log('🎯 [MOBILE-GESTURE] 列表彈性滾動開始 (基於當前位置)')
  console.log('🔍 [DEBUG] 容器檢查:', {
    hasContainer: !!container,
    containerWidth: container.clientWidth,
    containerScrollWidth: container.scrollWidth,
    foundFirstList: !!firstList,
    firstListWidth: firstList?.offsetWidth,
    calculatedListWidth: listWidth
  })
  
  // 🧒 真正的 Trello 邏輯：檢查當前滾動位置
  const currentScroll = container.scrollLeft
  const containerWidth = container.clientWidth
  
  // 🎯 步驟1：計算每個列表的邊界位置
  const listPositions = viewData.value.lists.map((_, index) => ({
    index,
    startX: index * listWidth,
    centerX: index * listWidth + listWidth / 2,
    endX: (index + 1) * listWidth
  }))
  
  // 🎯 步驟2：找出最接近螢幕中心的列表
  const screenCenter = currentScroll + containerWidth / 2
  let closestListIndex = 0
  let minDistance = Infinity
  
  listPositions.forEach(pos => {
    const distance = Math.abs(pos.centerX - screenCenter)
    if (distance < minDistance) {
      minDistance = distance
      closestListIndex = pos.index
    }
  })
  
  console.log('🧒 [真正邏輯] 位置判斷:', {
    '當前滾動位置': currentScroll,
    '螢幕中心在': screenCenter,
    '最近的列表': closestListIndex,
    '列表中心位置': listPositions[closestListIndex]?.centerX,
    '距離': minDistance
  })
  
  // 🎯 步驟3：目標就是最近的列表
  const targetListIndex = closestListIndex
  
  // 🎯 步驟4：讓列表置中 - 像拼圖對齊格子中間
  const targetScroll = targetListIndex * listWidth + (listWidth - containerWidth) / 2
  
  // 🔍 滾動前詳細檢查
  console.log('🔍 [DEBUG] 滾動前狀態檢查:', {
    containerScrollLeft: container.scrollLeft,
    containerOffsetWidth: container.offsetWidth,
    containerScrollWidth: container.scrollWidth,
    listCount: viewData.value.lists.length,
    targetScroll: targetScroll,
    targetListIndex: targetListIndex,
    canScroll: container.scrollWidth > container.clientWidth
  })

  // 🎊 超順滑的 Trello 風格滾動
  console.log('📜 [SCROLL] 開始滾動到位置:', targetScroll)
  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
  
  // 🔍 滾動後立即檢查（可能不會馬上變化，因為是 smooth 滾動）
  setTimeout(() => {
    console.log('📜 [SCROLL] 滾動後狀態:', {
      newScrollLeft: container.scrollLeft,
      expectedScroll: targetScroll,
      scrollSuccess: Math.abs(container.scrollLeft - targetScroll) < 10
    })
  }, 100)
  
  // 🎉 添加視覺回饋與震動回饋
  console.log('🎯 [MOBILE-GESTURE] 列表跳轉詳情:')
  console.log('  📊 目標列表:', targetListIndex)
  console.log('  🎯 目標滾動位置:', targetScroll)
  console.log('  📐 當前滾動位置:', currentScroll)
  console.log('  📏 將滑動:', Math.abs(targetScroll - currentScroll), '像素')
  
  // 如果有明顯滑動，添加震動回饋
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
      const [vx] = (velocity as [number, number] | undefined) || [0, 0]
      
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

// 拖拽事件處理
const onDragStart = (item: any, type: 'card' | 'list') => {
  console.log('📱 [MOBILE-BOARD] 拖拽開始:', { item, type })
  draggingState.value.isDragging = true
  draggingState.value.draggedItem = item
  draggingState.value.dragType = type
}

const onDragEnd = () => {
  console.log('📱 [MOBILE-BOARD] 拖拽結束')
  draggingState.value.isDragging = false
  draggingState.value.draggedItem = null
  draggingState.value.dragType = null
}

// 處理卡片拖拽移動事件
const onCardMove = async (event: any) => {
  console.log('📱 [MOBILE-BOARD] Card move event:', event)
  
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
      await handleCardMove([currentListId])
      console.log('✅ [MOBILE-BOARD] 同列表移動處理完成')
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
      await handleCardMove([targetListId])
      console.log('✅ [MOBILE-BOARD] 跨列表移動處理完成')
    }
  }
}

/**
 * 🎯 超強樂觀更新系統 - 既快又安全！
 * 
 * 🧒 十歲小朋友解釋：
 * - 🚀 快：你一按按鈕，畫面立刻變化（不用等網路）
 * - 🛡️ 安全：如果網路有問題，會恢復原狀並告訴你
 * - 💡 聰明：不同操作用不同策略，給你最好的體驗
 */

// 🗑️ 卡片刪除 - 需要確認的重要操作
const onCardDelete = async (card: Card) => {
  console.log('🗑️ [MOBILE-BOARD] 刪除卡片:', card.title)
  
  // 🛡️ 重要操作：先確認，再執行，讓用戶知道結果
  if (!confirm(`確定要刪除卡片「${card.title}」嗎？`)) {
    return
  }
  
  try {
    // 這個操作用戶需要知道是否成功，所以等待結果
    await deleteCardAction(card)
    console.log('✅ [MOBILE-BOARD] 卡片刪除成功')
    // 可以顯示成功提示（可選）
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 卡片刪除失敗:', error)
    alert('刪除失敗，請稍後再試')
  }
}

// ✏️ 卡片標題更新 - 樂觀更新策略  
const onCardUpdateTitle = async (cardId: string, newTitle: string) => {
  console.log('✏️ [MOBILE-BOARD] 更新卡片標題:', { cardId, newTitle })
  
  // 🚀 樂觀更新：不等待，讓用戶感覺超快
  // Store 內部已經實現了樂觀更新 + 失敗回滾
  updateCardTitleAction(cardId, newTitle).catch(error => {
    console.error('❌ [MOBILE-BOARD] 卡片標題更新失敗:', error)
    // 錯誤已在 Store 層處理回滾，這裡只需要記錄
  })
  
  console.log('⚡ [MOBILE-BOARD] 卡片標題樂觀更新完成')
}

// 📌 新增卡片 - 樂觀更新 + 錯誤處理
const onListAddCard = async (listId: string, title: string) => {
  console.log('📌 [MOBILE-BOARD] 新增卡片:', { listId, title })
  
  try {
    // 🚀 Store 已實現樂觀更新，我們只需要處理錯誤
    await addCardAction(listId, title, 'medium')
    console.log('✅ [MOBILE-BOARD] 卡片新增完成')
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 新增卡片失敗:', error)
    // Store 已經回滾了，我們提供用戶友好的錯誤訊息
    alert('新增卡片失敗，請檢查網路連線後再試')
  }
}

// 🗑️ 列表刪除 - 需要確認的重要操作
const onListDelete = async (listId: string) => {
  console.log('🗑️ [MOBILE-BOARD] 刪除列表:', listId)
  
  // 🛡️ 重要操作：先確認，這是不可逆的操作
  if (!confirm('確定要刪除這個列表嗎？列表中的所有卡片也會一併刪除！')) {
    return
  }
  
  try {
    // 刪除操作用戶需要明確的結果反饋
    await deleteListAction(listId)
    console.log('✅ [MOBILE-BOARD] 列表刪除成功')
    // 可以顯示成功提示
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 列表刪除失敗:', error)
    alert('刪除失敗，請稍後再試')
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

// 新增列表功能
const startAddList = async () => {
  isAddingList.value = true
  newListTitle.value = ''
  
  await nextTick()
  if (newListInput.value) {
    newListInput.value.focus()
  }
}

const saveNewList = async () => {
  if (isSavingList.value) return
  
  const titleToSave = newListTitle.value.trim()
  if (!titleToSave) return
  
  isSavingList.value = true
  
  try {
    await addList(titleToSave)
    isAddingList.value = false
    newListTitle.value = ''
    console.log(`✅ [MOBILE-BOARD] 成功創建列表: ${titleToSave}`)
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 創建列表失敗:', error)
  } finally {
    isSavingList.value = false
  }
}

const cancelAddList = () => {
  isAddingList.value = false
  newListTitle.value = ''
}

// 卡片模態框
const openCardModal = (card: Card) => {
  selectedCard.value = card
  showCardModal.value = true
}

const closeCardModal = () => {
  showCardModal.value = false
  selectedCard.value = null
}

// 初始化 - 只處理基本手勢，避免重複初始化列表手勢
onMounted(async () => {
  console.log('📱 [MOBILE-BOARD] 組件初始化')
  
  // 🚫 不重複載入資料，由上層 TrelloBoard 負責
  // await loadBoard() 
  
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
  width: calc(100vw - 6rem); /* 手機版每個列表佔滿寬度，留更多邊距 */
  min-width: 280px; /* 最小寬度保證 */
  max-width: 400px; /* 最大寬度限制 */
  flex-shrink: 0;
  scroll-snap-align: center; /* CSS scroll-snap 對齊 */
}

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