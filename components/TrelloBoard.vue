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
      
      <!-- 📱 手機版：使用 vue-draggable-next + 自訂手勢處理 -->
      <template v-else>
        <div class="flex gap-4 overflow-x-auto" ref="mobileListsContainer">
          <ListItem
            v-for="list in viewData.lists" 
            :key="list.id"
            :list="list"
            :dragging="draggingState.isDragging"
            :is-mobile="true"
            @card-move="onCardMove"
            @open-card-modal="openCardModal"
            @card-delete="onCardDelete"
            @card-update-title="onCardUpdateTitle"
            @list-add-card="onListAddCard"
            @list-delete="onListDelete"
            @list-update-title="onListUpdateTitle"
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
// import { useGesture } from '@vueuse/gesture' // 暫時不用
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

// 📱 手機版：專注於拖拽功能，移除干擾性手勢
const setupMobileGestures = () => {
  console.log('🔧 [MOBILE-SETUP] setupMobileGestures 被調用')
  console.log('🔧 [MOBILE-SETUP] mobileListsContainer.value:', mobileListsContainer.value)
  console.log('🔧 [MOBILE-SETUP] isMobile.value:', isMobile.value)
  
  // 🔍 立即測試事件綁定
  setTimeout(() => {
    console.log('🔍 [TEST] 5秒後測試事件監聽器...')
    if (mobileListsContainer.value) {
      console.log('🔍 [TEST] 容器存在，嘗試觸發測試事件')
      mobileListsContainer.value.click()
    }
  }, 5000)
  
  if (!mobileListsContainer.value) {
    console.error('❌ [MOBILE-BOARD] 無法初始化：mobileListsContainer 不存在')
    console.log('🔧 [DEBUG] DOM 中的 mobileListsContainer ref:', document.querySelector('[ref="mobileListsContainer"]'))
    return
  }
  
  const container = mobileListsContainer.value
  const firstList = container.querySelector('.mobile-list-item')
  
  console.log('📱 [MOBILE-BOARD] 初始化手機版拖拽優先系統', {
    container: container,
    containerTag: container.tagName,
    containerClasses: container.className,
    width: container.clientWidth,
    scrollWidth: container.scrollWidth,
    children: container.children.length,
    firstListFound: !!firstList,
    firstListTag: firstList?.tagName,
    firstListClasses: firstList?.className
  })
  
  // 🎯 只處理非拖拽區域的列表切換手勢
  let startX = 0
  let isListGesture = false
  
  /**
   * 🎮 手指開始觸碰螢幕時的處理函式
   * 
   * 想像場景：
   * 就像你在圖書館裡，手指剛碰到書架
   * 這時候還不知道你要做什麼，所以先記錄下來：
   * - 手指碰到的位置（startX）
   * - 碰到的是什麼（書架還是書？）
   * 
   * 為什麼要記錄 startX？
   * - 就像做記號：「手指從這裡開始」
   * - 之後手指移動時，才能計算移動了多遠
   * - 像是量距離前要先標記起點一樣！
   */
  const handleListTouchStart = (e: TouchEvent) => {
    console.log('👆 [MOBILE-TOUCH] touchstart 觸發！', {
      touches: e.touches.length,
      target: (e.target as HTMLElement)?.tagName || 'NO_TARGET'
    })
    
    const target = e.target as HTMLElement
    
    // 🚫 檢查：手指是不是碰到卡片？
    // 如果是卡片，就不管（讓卡片自己處理拖拽）
    if (target.closest('.card-draggable') || 
        target.closest('draggable') || 
        target.closest('[draggable="true"]')) {
      console.log('🚫 [MOBILE-TOUCH] 在拖拽區域，跳過手勢處理')
      return  // 停止！讓卡片自己處理
    }
    
    // 📏 記錄起始位置
    const touch = e.touches[0]
    startX = touch.clientX  // 記住手指開始的 X 座標（橫向位置）
    isListGesture = false   // 重置狀態：還不確定是不是列表滑動
    console.log('✅ [MOBILE-TOUCH] 開始手勢追蹤，起始位置:', startX)
  }
  
  /**
   * 🎮 手指移動時的處理函式
   * 
   * 想像場景：
   * 你在手機上有一排書架（列表），每個書架上有很多書（卡片）
   * 這個函式要判斷：你是想「左右滑動看其他書架」還是「拿起一本書」？
   * 
   * 判斷方法：
   * 1. 如果手指碰到的是書（卡片） → 不處理，讓你能拿書
   * 2. 如果手指在書架空白處，且移動超過 15 像素 → 判定為要滑動書架
   * 
   * 為什麼要計算 deltaX（移動距離）？
   * - 手指輕輕碰一下（移動 <15px）= 可能只是要點擊或手抖
   * - 手指明顯滑動（移動 >15px）= 真的想要滑動列表
   * - 就像老師說「舉手超過頭頂才算真的要發問」一樣的道理！
   */
  const handleListTouchMove = (e: TouchEvent) => {
    // 沒有列表容器就不處理
    if (!mobileListsContainer.value) return
    
    const target = e.target as HTMLElement
    
    // 🚫 檢查：手指是不是碰到卡片？
    // 如果是，就讓卡片自己處理拖拽，我們不管
    if (target.closest('.card-draggable') || 
        target.closest('draggable') ||
        target.closest('[draggable="true"]')) {
      return  // 停止！讓卡片自己處理
    }
    
    // 📏 計算手指移動了多遠
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX  // 現在位置 - 開始位置 = 移動距離
    // console.log('👆 [MOBILE-TOUCH] touchmove，移動距離:', deltaX)
    
    // 🎯 判斷：移動超過 15 像素了嗎？
    // Math.abs() 是取絕對值，因為左滑是負數，右滑是正數
    // !isListGesture 確保只判斷一次，不重複設定
    if (Math.abs(deltaX) > 15 && !isListGesture) {
      isListGesture = true  // 標記：這是列表滑動手勢！
      e.preventDefault()    // 阻止其他預設行為
      console.log('📋 [MOBILE-GESTURE] 列表切換手勢觸發 (移動 >15px)')
    }
  }
  
  /**
   * 🎮 手指離開螢幕時的處理函式
   * 
   * 想像場景：
   * 就像你滑動手機照片，手指離開時：
   * - 如果滑到一半，照片會自動「彈回」或「滑到下一張」
   * - 這叫「snap back」（彈回對齊）
   * 
   * 這個函式做什麼？
   * 1. 檢查：剛剛是不是在滑動列表？（isListGesture）
   * 2. 如果是 → 呼叫 handleMobileListSnapBack() 讓列表對齊
   * 3. 重置狀態，準備下次觸碰
   * 
   * 為什麼不管移動多少都要檢查？
   * - 就像 Trello 的設計：只要有滑動，就要幫你對齊到最近的列表
   * - 讓使用者不用很精準地滑，系統會幫忙對齊
   */
  const handleListTouchEnd = (e: TouchEvent) => {
    console.log('👆 [MOBILE-TOUCH] touchend 觸發！', {
      isListGesture,
      hasContainer: !!mobileListsContainer.value
    })
    
    // 如果剛剛是列表滑動手勢，且有列表容器
    if (isListGesture && mobileListsContainer.value) {
      console.log('✅ [MOBILE-TOUCH] 手勢結束，檢查列表位置並決定 snap 目標')
      
      // 🎯 執行彈回對齊
      handleMobileListSnapBack()  // 讓列表自動對齊到最近的位置
    }
    
    // 重置狀態，為下次觸碰做準備
    isListGesture = false
  }
  
  // 🔍 先添加簡單的測試事件
  const testClick = () => console.log('🎯 [TEST] 容器被點擊了！')
  container.addEventListener('click', testClick)
  
  // 只監聽列表容器的特定區域
  container.addEventListener('touchstart', handleListTouchStart, { passive: true })
  container.addEventListener('touchmove', handleListTouchMove, { passive: false })
  container.addEventListener('touchend', handleListTouchEnd, { passive: true })
  
  // 🧪 桌面測試用：添加滑鼠事件來測試
  container.addEventListener('mousedown', (e) => {
    console.log('🖱️ [DESKTOP-TEST] mousedown 觸發')
    handleListTouchStart({
      touches: [{ clientX: e.clientX }],
      target: e.target
    } as any)
  })
  
  container.addEventListener('mousemove', (e) => {
    if (isListGesture) {
      handleListTouchMove({
        touches: [{ clientX: e.clientX }],
        preventDefault: () => {},
        target: e.target
      } as any)
    }
  })
  
  container.addEventListener('mouseup', (e) => {
    if (isListGesture) {
      console.log('🖱️ [DESKTOP-TEST] mouseup 觸發')
      handleListTouchEnd({
        changedTouches: [{ clientX: e.clientX }]
      } as any)
    }
  })
  
  console.log('📱 [MOBILE-BOARD] 拖拽優先系統已初始化 (含桌面測試支援)')
  console.log('🔧 [DEBUG] 事件監聽器已綁定到:', {
    containerElement: container,
    eventListeners: ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mousemove', 'mouseup']
  })
}

// 📋 清理：移除不需要的函數，專注於拖拽功能

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
 * 
 * 🚀 效能考量：
 * - 使用 querySelector 快速找到列表元素
 * - 一次性計算所有位置，避免重複 DOM 查詢
 * - 使用 CSS smooth scroll 硬體加速
 * - 設置防抖機制避免重複觸發
 * 
 * 🎨 使用者體驗設計：
 * - 模仿 iOS Photos 和 Trello 的滑動體驗
 * - 30ms 震動回饋提供觸覺確認
 * - 詳細 console.log 方便開發者除錯
 * - 500ms 冷卻時間防止過度敏感
 * 
 * 🔧 容錯機制：
 * - 如果找不到 .mobile-list-item，會嘗試備用選擇器
 * - 如果無法計算寬度，使用預設 320px
 * - 檢查容器是否存在和是否正在執行中
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

// 📱 監聽資料載入完成後初始化手勢
watch(() => viewData.value.lists.length, (newLength) => {
  if (newLength > 0 && isMobile.value) {
    console.log('🔧 [WATCH] 列表資料載入完成，準備初始化手機版手勢系統...')
    nextTick(() => {
      console.log('🔧 [WATCH] nextTick 執行，開始初始化手勢...')
      setupMobileGestures()
    })
  }
}, { immediate: true })

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

/* 🖥️ 桌面版卡片拖拽樣式 - 修復跨列表拖拽視覺反饋 */
:deep(.sortable-ghost) {
  background: #f0fdf4 !important;
  border: 2px dashed #22c55e !important;
  border-radius: 8px !important;
  opacity: 0.5 !important;
  transform: none !important;
}

/* 🖥️ 桌面版卡片拖拽 - 不傾斜，保持正立 */
:deep(.sortable-chosen) {
  transform: scale(1.02) !important; /* 🔧 移除 rotate，保持正立 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
  opacity: 0.9 !important;
  z-index: 999 !important;
  cursor: grabbing !important;
  transition: all 0.15s ease-out !important;
}

:deep(.sortable-drag) {
  transform: scale(1.05) !important; /* 🔧 移除 rotate，保持正立 */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25) !important;
  opacity: 0.95 !important;
  z-index: 1000 !important;
  cursor: grabbing !important;
  border: 2px solid #3b82f6 !important;
  background: #ffffff !important;
}

/* 📱 手機版容器樣式 */
.mobile-container {
  touch-action: pan-x pan-y;
  -webkit-overflow-scrolling: touch;
}

.mobile-list-item {
  width: calc(100vw - 6rem); /* 手機版每個列表佔滿寬度，留更多邊距 */
  min-width: 280px; /* 最小寬度保證 */
  max-width: 400px; /* 最大寬度限制 */
  flex-shrink: 0;
}

/* 📱 手機版卡片拖拽樣式 - 超順滑版本！ */
:deep(.mobile-list-item .sortable-delay) {
  opacity: 0.8 !important;
  transform: scale(0.98) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: linear-gradient(135deg, #fef3c7, #fde68a) !important;
  border: 2px dashed #f59e0b !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2) !important;
}

:deep(.mobile-list-item .sortable-chosen) {
  opacity: 0.95 !important;
  transform: scale(1.03) rotate(-1deg) !important;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25) !important;
  z-index: 999 !important;
  border: 2px solid #10b981 !important;
  background: linear-gradient(135deg, #ffffff, #f0fdf4) !important;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
}

/* 🎯 手機版拖拽卡片 - 確保跟著手指！ */
:deep(.mobile-list-item .sortable-drag) {
  transform: scale(1.08) rotate(-2deg) !important; /* 輕微傾斜 */
  box-shadow: 0 15px 40px rgba(59, 130, 246, 0.3) !important;
  opacity: 0.98 !important;
  z-index: 1000 !important;
  border: 2px solid #3b82f6 !important;
  background: linear-gradient(135deg, #ffffff, #dbeafe) !important;
  transition: none !important; /* 🔑 無動畫，立即跟手指 */
}

/* 📱 手機版被選中的卡片 */
:deep(.mobile-list-item .sortable-chosen) {
  opacity: 0.95 !important;
  transform: scale(1.03) rotate(-1deg) !important;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25) !important;
  z-index: 999 !important;
  border: 2px solid #10b981 !important;
  background: linear-gradient(135deg, #ffffff, #f0fdf4) !important;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
}

/* 📱 手機版拖拽時的特殊效果 */
:deep(.mobile-list-item .sortable-ghost) {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  border: 2px dashed #22c55e !important;
  opacity: 0.6 !important;
  transform: scale(0.95) !important;
  transition: all 0.2s ease !important;
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
