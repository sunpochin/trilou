<!--
  手機版看板組件 - 專門為手機版設計
  
  📱 特色：
  - 使用 @vueuse/gesture 處理觸控手勢
  - 優化觸控操作體驗
  - 支援列表左右切換 + 卡片拖拽
  - 無殘影的流暢動畫
-->

<template>
  <!-- 手機版看板主容器 -->
  <div 
    ref="boardContainerRef"
    class="flex gap-6 p-6 h-[85vh] overflow-x-auto bg-gray-100 font-sans"
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
      <!-- 📱 手機版列表容器 - 使用 vue-draggable-next + @vueuse/gesture -->
      <draggable 
        class="flex gap-6" 
        :list="viewData.lists" 
        @change="onListMove"
        tag="div"
        :disabled="false"
        :animation="200"
        ghostClass="mobile-list-ghost"
        chosenClass="mobile-list-chosen"
        dragClass="mobile-list-dragging"
      >
        <ListItem
          v-for="list in viewData.lists" 
          :key="list.id"
          :list="list"
          :dragging="false"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
          @card-delete="onCardDelete"
          @card-update-title="onCardUpdateTitle"
          @list-add-card="onListAddCard"
          @list-delete="onListDelete"
          @list-update-title="onListUpdateTitle"
          class="mobile-list-item"
        />
      </draggable>

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
import { ref, nextTick, onMounted } from 'vue'
import ListItem from '@/components/ListItem.vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
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
const { viewData, handleCardMove, handleListMove } = useBoardView()
const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction, addCard: addCardAction } = useCardActions()

// 看板容器的 DOM 引用
const boardContainerRef = ref<HTMLElement | null>(null)

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 新增列表狀態管理
const isAddingList = ref(false)
const newListTitle = ref('')
const newListInput = ref<HTMLInputElement | null>(null)

// 📱 手機版長按 + 拖拽系統
const longPressTimer = ref<number | null>(null)
const isLongPressing = ref(false)
const cardLongPressMode = ref(false)

// 📋 手機版列表切換系統
const isListSnapping = ref(false)

// 🎯 進階手機手勢初始化
// 💡 十歲小朋友解釋：這就像教手機如何分辨「輕拍」和「重按」！
const setupAdvancedMobileGestures = () => {
  if (!boardContainerRef.value) {
    console.error('❌ [MOBILE-BOARD] 無法初始化手勢：容器不存在')
    return
  }
  
  console.log('📱 [MOBILE-BOARD] 初始化進階手勢系統...', { 
    container: boardContainerRef.value,
    clientWidth: boardContainerRef.value.clientWidth,
    scrollWidth: boardContainerRef.value.scrollWidth
  })
  
  // 📱 整個看板的手勢處理（列表切換）
  // 💡 useGesture = @vueuse/gesture 套件，專門處理手機觸控手勢
  // 💡 就像遊戲手把，可以偵測各種手勢（拖拽、滑動、長按等）
  
  console.log('🎯 [MOBILE-BOARD] 設置 useGesture...')
  
  useGesture({
    // 🔋 onDragStart = 手指剛碰到螢幕的瞬間
    // 💡 十歲小朋友解釋：就像你剛把手指放在螢幕上，還沒開始移動
    onDragStart: () => {
      console.log('🔋 [MOBILE-GESTURE] 開始觸控')
      isLongPressing.value = false      // 重設長按狀態
      cardLongPressMode.value = false   // 重設卡片拖拽模式
      
      // ⏰ 設定 0.75 秒計時器 (原本是 1.5 秒，後來改成 0.75 秒比較快)
      // 💡 十歲小朋友解釋：就像設定一個鬧鐘，0.75秒後會響鈴
      // 💡 如果 0.75 秒內手指放開 = 滑動模式
      // 💡 如果 0.75 秒後還在按 = 拖拽模式
      longPressTimer.value = window.setTimeout(() => {
        console.log('⏰ [MOBILE-GESTURE] 長按 0.75 秒達成！進入卡片拖拽模式')
        isLongPressing.value = true
        cardLongPressMode.value = true
        
        // 📳 震動回饋 - 告訴使用者「現在可以拖拽卡片了！」
        // 💡 十歲小朋友解釋：就像遊戲手把的震動，告訴你「開大絕了！」
        if (navigator.vibrate) {
          navigator.vibrate(50)  // 震動 50 毫秒
        }
      }, 750)  // 0.75 秒 = 750 毫秒
    },
    
    // 🏃‍♂️ onDrag = 手指在螢幕上移動時
    // 💡 十歲小朋友解釋：就像你的手指在螢幕上畫畫，會不斷告訴我們位置
    onDrag: ({ movement, velocity }) => {
      // 📏 movement = [mx, my] = 手指移動的距離 (水平, 垂直)
      // 💡 mx = 左右移動多少像素，my = 上下移動多少像素
      const [mx, my] = movement
      
      // 🏎️ velocity = [vx, vy] = 手指移動的速度 (水平, 垂直)  
      // 💡 用來判斷是「慢慢滑」還是「快速滑」，決定滑動力度
      const [vx] = velocity
      
      // 📦 卡片拖拽模式：0.75秒後允許垂直拖拽
      // 💡 十歲小朋友解釋：如果剛剛「鬧鐘響了」，現在是拖拽卡片時間！
      if (cardLongPressMode.value) {
        console.log('📦 [MOBILE-GESTURE] 卡片拖拽模式:', { mx, my })
        // 🎯 這時候把控制權交給 vue-draggable-next
        // 💡 就像換司機開車，現在 vue-draggable-next 來處理卡片移動
        return
      }
      
      // 📋 列表切換模式：水平拖拽 (左右滑動)
      // 💡 十歲小朋友解釋：如果還沒響鈴，而且手指是「左右移動」就滑動看板
      // 💡 Math.abs(mx) > Math.abs(my) = 左右移動比上下移動多
      // 💡 Math.abs(mx) > 30 = 至少移動 30 像素才算數 (避免手抖)
      if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 30) {
        console.log('📋 [MOBILE-GESTURE] 列表水平切換:', { mx, vx })
        handleListSwipe(mx, vx)  // 處理列表滑動
      }
    },
    
    // 🏁 onDragEnd = 手指離開螢幕時
    // 💡 十歲小朋友解釋：就像你把手指從螢幕上拿開，動作結束了
    onDragEnd: ({ movement }) => {
      const [mx] = movement  // 最終的水平移動距離
      console.log('🏁 [MOBILE-GESTURE] 觸控結束')
      
      // ⏰ 清除計時器 - 把鬧鐘關掉
      // 💡 因為手指已經放開了，不需要再計時了
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
      
      // 🎯 如果是短時間拖拽，處理列表彈性滾動 (像 Trello 的彈跳效果)
      // 💡 十歲小朋友解釋：如果沒有響鈴 + 手指滑得夠遠，就讓看板「彈跳」到下一個列表
      if (!cardLongPressMode.value && Math.abs(mx) > 50) {
        handleListSnapBack(mx)  // 彈跳到下一個列表
      }
      
      // 🔄 重設所有狀態 - 準備下次觸控
      // 💡 就像重新開機，把所有狀態歸零，準備下次使用
      isLongPressing.value = false
      cardLongPressMode.value = false
    }
  }, {
    // 🎯 useGesture 的設定選項
    domTarget: boardContainerRef,  // 監聽的目標元素 (整個看板容器)
    drag: {
      threshold: 5,  // 閾值：手指移動至少 5 像素才算拖拽
      // 💡 十歲小朋友解釋：避免手指輕微抖動就觸發拖拽，要移動 5 像素才算
    },
    // 🔍 Debug: 啟用詳細日志
    eventOptions: { passive: false },
  })
  
  // 🔍 測試：手動加一個簡單的觸控事件監聽器  
  const testElement = boardContainerRef.value
  if (testElement) {
    console.log('🧪 [MOBILE-BOARD] 添加測試事件監聽器到:', testElement)
    
    // 👆 觸控事件 (真實手機)
    testElement.addEventListener('touchstart', (e) => {
      console.log('👆 [TEST] touchstart 觸發！', e.touches.length, 'touches')
    }, { passive: true })
    
    testElement.addEventListener('touchmove', (e) => {
      console.log('👆 [TEST] touchmove 觸發！移動:', e.touches[0]?.clientX, e.touches[0]?.clientY)
    }, { passive: true })
    
    testElement.addEventListener('touchend', (e) => {
      console.log('👆 [TEST] touchend 觸發！')
    }, { passive: true })
    
    // 🖱️ 滑鼠事件 (桌機模擬手機)
    let isMouseDragging = false
    let startX = 0
    
    testElement.addEventListener('mousedown', (e) => {
      isMouseDragging = true
      startX = e.clientX
      console.log('🖱️ [TEST] mousedown 觸發！開始位置:', startX)
    })
    
    testElement.addEventListener('mousemove', (e: MouseEvent) => {
      if (isMouseDragging) {
        const deltaX = e.clientX - startX
        console.log('🖱️ [TEST] mousemove 拖拽中！移動:', deltaX, 'px')
      }
    })
    
    testElement.addEventListener('mouseup', (e) => {
      if (isMouseDragging) {
        const deltaX = e.clientX - startX
        console.log('🖱️ [TEST] mouseup 拖拽結束！總移動:', deltaX, 'px')
        isMouseDragging = false
      }
    })
    
    // 🎯 滾輪事件 (你剛才用的)
    testElement.addEventListener('wheel', (e) => {
      console.log('🎡 [TEST] wheel 滾輪事件！', e.deltaX, e.deltaY)
      console.log('⚠️  滾輪事件不會觸發 useGesture，需要用拖拽！')
    }, { passive: true })
  }
  
  console.log('📱 [MOBILE-BOARD] 進階手機手勢系統已初始化')
}

// 📋 列表滑動處理
// 💡 十歲小朋友解釋：當你的手指「左右滑動」時，讓看板跟著移動
const handleListSwipe = (deltaX: number, velocityX: number) => {
  // 🚫 如果正在彈跳中，不要重複處理
  // 💡 避免滑動到一半又觸發新的滑動，會很亂
  if (isListSnapping.value) return
  
  // 📱 簡化版列表切換：直接滾動容器
  // 💡 十歲小朋友解釋：就像翻書頁，手指往左滑，書頁往右翻
  if (boardContainerRef.value) {
    const currentScroll = boardContainerRef.value.scrollLeft  // 現在滾動到哪裡
    const newScroll = Math.max(0, currentScroll - deltaX)     // 計算新位置 (不能滾到負數)
    
    // 🎬 平滑滾動到新位置
    // 💡 behavior: 'smooth' = 慢慢移動過去，不是瞬間跳過去
    boardContainerRef.value.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }
  
  // 🏎️ 記錄滑動速度 (未來可以用來做更強的彈跳效果)
  // 💡 十歲小朋友解釋：記住你滑得多快，滑得越快可能彈得更遠
  console.log('📋 [MOBILE-GESTURE] 滑動速度:', velocityX)
}

// 🎯 列表彈性滾動（像 Trello 的彈跳效果）
// 💡 十歲小朋友解釋：當你滑動夠遠時，看板會「彈跳」到下一個列表，就像翻頁一樣！
const handleListSnapBack = (deltaX: number) => {
  // 🚫 檢查條件：容器存在 + 沒有正在彈跳
  if (!boardContainerRef.value || isListSnapping.value) {
    console.log('🚫 [MOBILE-GESTURE] 彈跳被阻止:', { 
      hasContainer: !!boardContainerRef.value, 
      isSnapping: isListSnapping.value 
    })
    return
  }
  
  isListSnapping.value = true  // 設定彈跳狀態，避免重複觸發
  const container = boardContainerRef.value
  
  // 🔍 動態計算列表寬度 (更準確)
  const containerWidth = container.clientWidth  // 容器可視寬度
  const listWidth = containerWidth * 0.85       // 列表約佔容器 85% 寬度
  
  console.log('🎯 [MOBILE-GESTURE] 列表彈性滾動開始:', { 
    deltaX, 
    containerWidth,
    listWidth,
    currentScroll: container.scrollLeft,
    maxScroll: container.scrollWidth - container.clientWidth
  })
  
  // 🧭 決定滾動方向和距離
  // 💡 十歲小朋友解釋：
  // 💡 如果 deltaX > 0 = 手指往右滑 → 看板往左移 (看到右邊的列表)
  // 💡 如果 deltaX < 0 = 手指往左滑 → 看板往右移 (看到左邊的列表)
  const direction = deltaX > 0 ? 1 : -1 // 修正方向邏輯
  const currentScroll = container.scrollLeft        // 現在的滾動位置
  const targetScroll = Math.max(0, 
    Math.min(
      container.scrollWidth - container.clientWidth,  // 不能超過最大滾動範圍
      currentScroll + (direction * listWidth)         // 目標位置
    )
  )
  
  console.log('🎯 [MOBILE-GESTURE] 彈跳計算:', {
    direction,
    currentScroll,
    targetScroll,
    willMove: targetScroll !== currentScroll
  })
  
  // 🎬 平滑滾動到目標位置 (彈跳效果)
  // 💡 十歲小朋友解釋：不是瞬間跳過去，而是慢慢滑過去，像彈珠一樣
  if (targetScroll !== currentScroll) {
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
    console.log('✅ [MOBILE-GESTURE] 執行彈跳滾動:', currentScroll, '→', targetScroll)
  } else {
    console.log('⏸️ [MOBILE-GESTURE] 已經在邊界，不滾動')
  }
  
  // ⏰ 重設彈性狀態 (0.5 秒後允許下次彈跳)
  // 💡 避免彈跳到一半又觸發新的彈跳
  setTimeout(() => {
    isListSnapping.value = false
    console.log('🔄 [MOBILE-GESTURE] 彈跳狀態重設，可以進行下次彈跳')
  }, 500)
}

// 🎯 組件初始化
onMounted(() => {
  console.log('📱 [MOBILE-BOARD] onMounted 開始初始化手勢系統')
  setupAdvancedMobileGestures()
  
  // 🔍 Debug: 檢查容器是否存在
  if (boardContainerRef.value) {
    console.log('✅ [MOBILE-BOARD] 容器找到了:', boardContainerRef.value)
    console.log('📏 [MOBILE-BOARD] 容器寬度:', boardContainerRef.value.scrollWidth, '可視寬度:', boardContainerRef.value.clientWidth)
  } else {
    console.error('❌ [MOBILE-BOARD] 容器沒找到！')
  }
})

// 📱 手機版拖拽狀態管理
const draggingState = ref({
  isDragging: false,
  draggedItem: null as any,
  dragType: null as 'card' | 'list' | null
})

// 📱 統一的拖拽事件處理
const onDragStart = (item: any, type: 'card' | 'list') => {
  console.log(`📱 [MOBILE-BOARD] 開始拖拽 ${type}:`, item)
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

// 處理卡片拖拉移動事件
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
      try {
        await handleCardMove([currentListId])
        console.log('✅ [MOBILE-BOARD] 同列表移動成功')
      } catch (error) {
        console.error('❌ [MOBILE-BOARD] 移動失敗:', error)
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
        console.log('✅ [MOBILE-BOARD] 跨列表移動成功')
      } catch (error) {
        console.error('❌ [MOBILE-BOARD] 跨列表移動失敗:', error)
      }
    }
  }
}

// 處理列表移動事件
const onListMove = async (event: any) => {
  console.log('📱 [MOBILE-BOARD] List move event:', event)
  
  if (event.moved) {
    try {
      await handleListMove()
      console.log('✅ [MOBILE-BOARD] 列表順序更新成功')
    } catch (error) {
      console.error('❌ [MOBILE-BOARD] 列表順序更新失敗:', error)
    }
  }
}

// 📱 卡片操作事件處理
const onCardDelete = async (card: Card) => {
  console.log('📱 [MOBILE-BOARD] 刪除卡片:', card.title)
  await deleteCardAction(card)
}

const onCardUpdateTitle = async (cardId: string, newTitle: string) => {
  console.log('📱 [MOBILE-BOARD] 更新卡片標題:', { cardId, newTitle })
  await updateCardTitleAction(cardId, newTitle)
}

const onListAddCard = async (listId: string, title: string) => {
  console.log('📱 [MOBILE-BOARD] 新增卡片:', { listId, title })
  await addCardAction(listId, title, 'medium')
}

const onListDelete = async (listId: string) => {
  console.log('📱 [MOBILE-BOARD] 刪除列表:', listId)
  await deleteListAction(listId)
}

const onListUpdateTitle = async (listId: string, newTitle: string) => {
  console.log('📱 [MOBILE-BOARD] 更新列表標題:', { listId, newTitle })
  await updateListTitleAction(listId, newTitle)
}

// 在組件載入時記錄
console.log('📱 [MOBILE-BOARD] 手機版看板載入')

// 處理新增列表（舊的 modal 方式，保留以備後用）
// const handleAddList = () => {
//   addList()
// }

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

// 保存新列表
const saveNewList = async () => {
  // 防止重複提交
  if (isSavingList.value) return
  
  const titleToSave = newListTitle.value.trim()
  if (!titleToSave) return
  
  isSavingList.value = true
  
  try {
    await addList(titleToSave)
    
    // 僅成功後才更新 UI
    isAddingList.value = false
    newListTitle.value = ''
    console.log(`✅ [MOBILE-BOARD] 成功創建列表: ${titleToSave}`)
    
  } catch (error) {
    console.error('❌ [MOBILE-BOARD] 創建列表失敗:', error)
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
</script>

<style scoped>
/* 📱 手機版專用樣式 */

/* 新增列表過渡動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 📱 手機版列表拖拽樣式 - 修復：列表不要歪 */
:deep(.mobile-list-ghost) {
  background: #e2e8f0 !important;
  border: 2px dashed #64748b !important;
  border-radius: 8px !important;
  opacity: 0.6 !important;
}

:deep(.mobile-list-chosen) {
  opacity: 0.8 !important;
  transform: scale(1.005) !important; /* 手機版輕微放大，不歪 */
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08) !important;
  transition: all 0.2s ease-out !important;
}

:deep(.mobile-list-dragging) {
  /* 🚫 手機版也不要歪列表 */
  transform: scale(1.01) !important; /* 不歪，只輕微放大 */
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
  transition: all 0.2s ease-out !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
}

/* 📱 手機版卡片拖拽樣式 - 修復「歪歪卡片」問題 */
:deep(.sortable-drag .card-draggable) {
  transform: rotate(-3deg) scale(1.03) !important;
  opacity: 0.9 !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.15s ease-out !important;
  border: 2px solid #10b981 !important;
  cursor: grabbing !important;
}

:deep(.sortable-ghost .card-draggable) {
  background: #f0fdf4 !important;
  border: 2px dashed #22c55e !important;
  opacity: 0.4 !important;
}

:deep(.sortable-chosen .card-draggable) {
  transform: scale(1.01) !important;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1) !important;
}

/* 手機版容器樣式 */
.mobile-list-item {
  width: calc(100vw - 3rem);
  margin: 0 1.5rem;
  max-width: none;
}

/* 手機版專用的平滑滾動 */
.smooth-scroll {
  scroll-behavior: smooth;
}

/* 防止拖拽時選取文字 */
:global(.card-draggable) {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>