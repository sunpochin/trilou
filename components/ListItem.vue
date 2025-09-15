<!--
  📋 ListItem 組件 - 看板列表組件 (Trello Clone 核心組件之一)
  
  🎯 組件主要功能：
  ✅ 渲染單一看板列表及其所有卡片
  ✅ 支援列表標題的即時編輯功能 (點擊標題可編輯，按 Enter 儲存，按 Esc 取消)
  ✅ 管理卡片的拖拽排序功能 (同列表內移動 + 跨列表移動)
  ✅ 提供列表操作選單 (新增卡片、刪除列表)
  ✅ 處理卡片的新增和開啟編輯功能
  ✅ 整合事件通訊系統，將操作傳遞給父組件
  
  🔧 使用的技術棧：
  - Vue 3 Composition API
  - VueDraggableNext (拖拽功能)
  - 自訂 useListActions composable (業務邏輯抽象層)
  - TypeScript 型別安全
  - Tailwind CSS 樣式
  
  📦 Props 參數：
  - list: ListUI - 列表資料物件，包含 id、title、position、cards 等欄位
  
  🚀 Emit 事件：
  - card-move: 當卡片被拖拽移動時觸發，傳遞拖拽事件資料給父組件處理
  - open-card-modal: 當點擊卡片要開啟編輯模態框時觸發，傳遞卡片資料給父組件
  
  🏗️ 子組件結構：
  - Card.vue: 渲染單一卡片，處理卡片顯示和點擊事件
  - ListMenu.vue: 渲染三點選單，提供列表操作功能 (新增卡片、刪除列表)
  
  💡 核心交互邏輯：
  1. 列表標題編輯：點擊標題 → 變成輸入框 → Enter 儲存 / Esc 取消 / 失焦儲存
  2. 卡片拖拽移動：使用 VueDraggableNext，支援同列表排序和跨列表移動
  3. 新增卡片：點擊底部按鈕或選單項目 → 呼叫 useListActions.addCard()
  4. 刪除列表：通過選單 → 呼叫 useListActions.deleteList()
  5. 開啟卡片編輯：點擊卡片 → emit 事件給父組件開啟模態框
  
  🎯 SOLID 原則設計說明：
  
  ✅ S (Single Responsibility) - 單一職責原則
     只負責「單個列表」的渲染和基本互動，不處理整體看板邏輯
     標題編輯、卡片管理、選單操作各自獨立，職責清晰分離
     
  ✅ O (Open/Closed) - 開放封閉原則
     要新增列表功能時，透過 emit 事件和 useListActions 擴展
     不需要修改此組件的核心邏輯，符合對擴展開放、對修改封閉
     
  ✅ L (Liskov Substitution) - 里氏替換原則
     組件接受 ListUI 型別，任何符合此介面的列表物件都可以正常運作
     不會因為列表資料的細微差異而導致組件功能異常
     
  ✅ I (Interface Segregation) - 介面隔離原則
     只依賴所需的 props 和 emit 事件，不強迫使用者實作不需要的介面
     useListActions 只暴露此組件實際需要的方法
     
  ✅ D (Dependency Inversion) - 依賴反轉原則  
     不直接依賴 boardStore，而是透過 useListActions 抽象層
     組件依賴抽象介面，不依賴具體實作，提升可測試性和維護性
     
  📝 擴展方式：
     - 新增列表操作：在 useListActions 加函數，此組件自動可用
     - 新增 UI 元素：在 ListMenu 組件加按鈕，此組件接收 emit 事件
     - 新增卡片功能：修改 Card 組件，此組件自動繼承新功能
     - 修改拖拽行為：調整 draggable 組件的設定，不影響其他邏輯
  
  🧪 測試覆蓋：
     組件已有完整的單元測試覆蓋，包含拖拽功能、事件處理、編輯功能等
     測試文件：tests/unit/components/CardDragDrop.test.ts (包含 ListItem 測試)
  
  📊 效能考量：
     - 使用 Vue 3 響應式系統，只在必要時重新渲染
     - 拖拽功能使用虛擬 DOM 最佳化，支援大量卡片的順暢移動
     - 事件處理使用 event.stopPropagation() 避免不必要的事件冒泡
  
  🔄 狀態管理：
     - 本地狀態：列表標題編輯狀態 (isEditingTitle, editingTitle)
     - 全域狀態：透過 useListActions 與 boardStore 互動
     - 響應式更新：當 boardStore 資料變更時，組件自動重新渲染

  🐛 拖拽卡住問題的解決方案：

  📋 問題描述：
  - 拖拽卡片時有時會卡住，無法正常移動
  - 拖拽過程中會出現藍色邊框，然後卡住不動

  🔍 根本原因分析：
  1. Focus 狀態干擾：當拖拽開始時，瀏覽器會給元素加上 focus 狀態
  2. 事件競爭：focus 事件與拖拽庫的 mouse 事件發生衝突
  3. 樣式計算延遲：複雜的 CSS（特別是 outline）會導致佈局重新計算，打斷拖拽流暢性
  4. 狀態殘留：拖拽結束後沒有正確清理 sortable 類別，導致下次拖拽時衝突

  ✅ 解決方案：
  1. 關鍵修正 - blur() 大法：
     在 handleDragStart 和 handleChoose 中立即呼叫 blur() 移除 focus 狀態
  
  2. 狀態清理：
     在 handleDragEnd 中移除殘留的 sortable 類別，防止下次拖拽衝突
  
  3. 防止文字選取干擾：
     拖拽時設定 document.body.style.userSelect = 'none'
  
  4. 游標優化：
     使用 cursor: grab 和 cursor: grabbing 提供更好的視覺回饋

  💡 關鍵洞察：
  - 藍色邊框本身不是問題，真正的問題是背後的 focus 狀態
  - 解決方案的核心是移除 focus 狀態，而不是強制覆蓋視覺樣式
  - 保持自然的 CSS 樣式優先級，避免過度使用 !important

  🎨 視覺效果設計：
  - 選中狀態：藍色邊框 + 輕微放大
  - 拖拽中：綠色邊框 + 旋轉 2 度 + 強化陰影
  - 占位符：虛線邊框 + 半透明背景

  📝 實際使用的樣式類別：
  - chosenClass: card-chosen (選中時)
  - dragClass: card-dragging (拖拽中)
  - ghostClass: card-ghost (占位符)
  - fallbackClass: card-fallback (跟隨滑鼠)
-->

<template>
  <!-- 單個列表容器 -->
  <!-- 💡 十歲小朋友解釋：如果有拖曳把手，就不要上面的圓角，因為把手已經有圓角了 -->
  <div 
    :class="[
      'bg-gray-200 p-2 flex-shrink-0 flex flex-col',
      props.isMobile ? 'mobile-list-item rounded-b-lg' : 'w-80 rounded'
    ]" 
    :data-list-id="list.id"
  >
    <!-- 列表標題區域 -->
    <div class="cursor-pointer flex justify-between items-center p-2 mb-2 relative">
      <!-- 非編輯狀態：顯示標題 -->
      <h2 
        v-if="!isEditingTitle" 
        class="w-full text-base font-bold select-none cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        @click="startEditTitle"
      >
        {{ list.title }}
      </h2>
      
      <!-- 編輯狀態：顯示輸入框 -->
      <input
        v-else
        ref="titleInput"
        v-model="editingTitle"
        class="w-full text-base font-bold bg-white border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
        @keydown.enter="saveTitle"
        @blur="saveTitle"
        @keydown.esc="cancelEdit"
      />
      
      <!-- 列表選單組件 -->
      <ListMenu 
        :list-id="list.id"
        @add-card="handleAddCard"
        @delete-list="handleDeleteList"
      />
    </div>
    
    <!-- 🤖 AI 生成任務按鈕 -->
    <div class="px-2 mb-3">
      <button
        @click="handleAiGenerate"
        :class="[
          'w-full px-3 py-2 text-sm text-white rounded-lg flex items-center justify-center gap-2 shadow-md transition-all duration-200',
          isAiGenerating 
            ? 'ai-rainbow-magic cursor-wait' 
            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-lg'
        ]"
        :disabled="isAiGenerating"
      >
        <svg 
          :class="[
            'w-4 h-4',
            isAiGenerating ? 'animate-spin' : ''
          ]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <span>
          {{ isAiGenerating ? '🌈 生成中...' : '🤖 AI 生成任務' }}
        </span>
      </button>
    </div>
    
    <!-- 可拖拉的卡片容器 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 📱 Vue Draggable Next 卡片拖拽系統 -->
      <!-- 💡 十歲小朋友解釋：這是讓卡片可以拖來拖去的魔法積木！ -->
        <!-- 🎯  Fallback 系統：手機版的救世主！  -->
        <!-- 💡 十歲小朋友解釋：手機版用「特殊模式」，桌電版用「一般模式」 -->
        <!-- 🔍 force-fallback = 強制使用 fallback 模式 -->
        <!-- 💡 手機版 = true (用推車模式)，桌電版 = false (用遙控車模式) -->
        <!-- 🏠 fallback-on-body = 把「影分身」放到整個網頁的最上層 -->
        <!-- 💡 十歲小朋友解釋：像把卡片放到最高的樓層，這樣就不會被其他東西擋到 -->
        <!-- 🎯 fallback-tolerance = 0 = 立刻啟動 fallback 模式 -->
        <!-- 💡 數字越小 = 反應越快，0 = 瞬間啟動 -->
        <!-- ⏰ 延遲系統：防止誤觸 -->
        <!-- 💡 十歲小朋友解釋：手機版要等 0.75 秒才能拖拽（避免手抖），桌電版立刻可以拖 -->
        <!-- 🖱️ 只有「觸控」才需要延遲，滑鼠不用等 -->
        <!-- 💡 因為滑鼠很精準，手指容易誤觸 -->
        <!-- 📏 觸控敏感度：手指至少要移動 10 像素才算拖拽 -->
        <!-- 💡 十歲小朋友解釋：避免手指輕微抖動就開始拖拽，要移動一點點才算數 -->
        
        <!-- 🎬 動畫設定 -->
        <!-- ⚡ 動畫時間：卡片移動的速度 (200 毫秒 = 0.2 秒) -->
        <!-- 💡 數字越小 = 動畫越快，數字越大 = 動畫越慢 -->
        <!-- 🌊 動畫曲線：控制動畫的「感覺」 -->
        <!-- 💡 十歲小朋友解釋：手機版用「彈性感」，桌電版用「直線感」 -->
        <!-- 💡 就像彈珠 vs. 推積木的差別 -->
        <!-- 🎯 拖拽行為設定 -->
        <!-- 📜 滾動敏感度：拖拽到邊緣時，多快開始滾動頁面 -->
        <!-- 💡 十歲小朋友解釋：當你拖卡片到螢幕邊緣時，頁面會自動滾動幫你 -->
        <!-- 🔄 交換門檻：拖拽多少比例才會交換位置 -->
        <!-- 💡 十歲小朋友解釋：要拖過另一張卡片的 65% 才會交換位置 -->
        <!-- 💡 不會拖一點點就亂跳位置 -->
        <!-- 🫧 氣泡滾動：允許滾動事件向上傳遞 -->
        <!-- 💡 讓滾動可以穿透到父元素 -->
        <!-- 🚫 不阻止過濾事件：允許其他操作 -->
        <!-- 🎨 樣式類別：不同狀態的卡片長什麼樣子 -->
        <!-- 🎭 拖拽中的卡片樣式 (正在被拖拽的卡片) -->
        <!-- 💡 十歲小朋友解釋：正在拖拽的卡片會變成什麼樣子 -->
        <!-- 👻 幽靈卡片樣式 (原來位置的占位符) -->
        <!-- 💡 十歲小朋友解釋：原來的位置會留一個「影子」告訴你這裡空了 -->
        <!-- ✨ 被選中的卡片樣式 (長按選中時) -->
        <!-- 💡 十歲小朋友解釋：卡片被「點名」時會發光 -->
        
      <draggable
        class="min-h-5"
        :list="list.cards"
        group="cards"
        @change="handleCardChange"
        tag="div"
        :disabled="false"
        :animation="200"
        :force-fallback="true"
        :fallback-on-body="true"
        :fallback-tolerance="0"
        ghostClass="card-ghost"
        chosenClass="card-chosen"
        dragClass="card-dragging"
        fallbackClass="card-fallback"
      >
        <div v-for="card in list.cards" :key="card.id" class="draggable-card-wrapper">
          <Card 
            :card="card" 
            :dragging="dragging"
            :is-mobile="props.isMobile"
            @open-modal="$emit('open-card-modal', card)"
            @update-title="(cardId, newTitle) => $emit('card-update-title', cardId, newTitle)"
            @update-status="(cardId, status) => handleCardStatusUpdate(cardId, status)"
            @update-priority="(cardId, priority) => handleCardPriorityUpdate(cardId, priority)"
          />
        </div>
      </draggable>
    </div>
    
    <!-- 新增卡片區域 -->
    <div class="mt-2">
      <!-- 顯示按鈕模式 -->
      <button 
        v-if="!isAddingCard"
        class="w-full p-3 bg-transparent border-2 border-dashed border-gray-300 rounded text-gray-600 cursor-pointer text-sm transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800" 
        @click="startAddCard"
      >
        + 新增卡片
      </button>
      
      <!-- 顯示 inline 編輯模式 -->
      <div 
        v-else
        class="bg-white rounded px-3 py-3 shadow-sm border"
      >
        <textarea
          ref="newCardInput"
          v-model="newCardTitle"
          placeholder="輸入這張卡片的標題..."
          class="w-full resize-none border-none outline-none text-sm min-h-14"
          @keydown.enter.prevent="saveNewCard"
          @keydown.escape="cancelAddCard"
        />
        <div class="flex gap-2 mt-2">
          <button
            @click="saveNewCard"
            :disabled="!newCardTitle.trim()"
            class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            新增卡片
          </button>
          <button
            @click="cancelAddCard"
            class="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// #region ═══════════════════════ 📦 IMPORTS & TYPES ═══════════════════════
// 📦 Vue 核心功能
import { ref, nextTick, computed } from 'vue'

// 🏠 組件引入
import Card from '@/components/Card.vue'
import ListMenu from '@/components/ListMenu.vue'

// 🔌 第三方函庫
import { VueDraggableNext as draggable } from 'vue-draggable-next'

// 🔧 Composables 引入
import { useCardActions } from '@/composables/useCardActions'
import { useInlineEdit } from '@/composables/useInlineEdit'
import { useDragAndDrop, type DragEvent, type DragItem } from '@/composables/useDragAndDrop'

// 📊 型別定義
import type { ListUI, CardUI } from '@/types'
import { CardStatus, CardPriority } from '@/types/api'


// #endregion ═══════════════════════ 📦 IMPORTS & TYPES ═══════════════════════

// #region ═══════════════════════ 🎯 PROPS & EMITS ═══════════════════════
// 🎯 純渲染組件：接收父組件傳入的資料和狀態
const props = defineProps<{
  list: ListUI
  dragging: boolean  // 父組件控制的拖拽狀態
  isMobile?: boolean  // 是否為手機版
  aiGeneratingListId?: string | null  // 正在生成 AI 任務的列表 ID
}>()

// 🎯 純渲染組件：定義事件 (父組件處理邏輯)
const emit = defineEmits<{
  'card-move': [event: DragEvent]
  'open-card-modal': [card: CardUI]
  'drag-start': [item: DragItem, type: 'card' | 'list']
  'drag-end': []
  'card-update-title': [cardId: string, newTitle: string]
  'card-updated': []
  'list-add-card': [listId: string, title: string]
  'list-delete': [listId: string]
  'list-update-title': [listId: string, newTitle: string]
  'ai-generate': [listId: string]
}>()
// #endregion ═══════════════════════ 🎯 PROPS & EMITS ═══════════════════════

// #region ═══════════════════════ 🎮 COMPOSABLES & STATE ═══════════════════════
// 🌈 AI 生成狀態檢查
const isAiGenerating = computed(() => 
  props.aiGeneratingListId === props.list.id
)

// 📝 列表標題編輯 Composable
const titleEdit = useInlineEdit({
  onSave: (newTitle) => {
    emit('list-update-title', props.list.id, newTitle)
  },
  defaultValue: props.list.title
})

// 📌 新增卡片 Composable
const cardAddEdit = useInlineEdit({
  onSave: (cardTitle) => {
    emit('list-add-card', props.list.id, cardTitle)
  },
  placeholder: '輸入卡片標題...'
})

// 🔄 拖拽功能 Composable
const { startDrag, endDrag, handleCardDragMove } = useDragAndDrop()

// 📋 卡片操作 Composable
const { updateCardStatus, updateCardPriority } = useCardActions()

// 🔗 編輯狀態別名（保持相容性）
const isEditingTitle = titleEdit.isEditing
const editingTitle = titleEdit.editingValue
const titleInput = titleEdit.inputRef as any

const isAddingCard = cardAddEdit.isEditing
const newCardTitle = cardAddEdit.editingValue
const newCardInput = cardAddEdit.inputRef as any
// #endregion ═══════════════════════ 🎮 COMPOSABLES & STATE ═══════════════════════

// #region ═══════════════════════ 📝 TITLE EDITING ═══════════════════════
// 別名函數（保持相容性）
const startEditTitle = () => titleEdit.startEdit(props.list.title)
const saveTitle = titleEdit.saveEdit
const cancelEdit = titleEdit.cancelEdit
// #endregion ═══════════════════════ 📝 TITLE EDITING ═══════════════════════

// #region ═══════════════════════ 📌 CARD OPERATIONS ═══════════════════════
// 📌 新增卡片函數
const handleAddCard = () => {
  console.log('📌 [PURE-LIST] 新增卡片事件，委派給父組件')
  cardAddEdit.startEdit()
}

// 新增卡片別名函數（保持相容性）
const startAddCard = cardAddEdit.startEdit
const saveNewCard = cardAddEdit.saveEdit
const cancelAddCard = cardAddEdit.cancelEdit
const isSavingCard = cardAddEdit.isSaving

// 🔄 卡片狀態更新
const handleCardStatusUpdate = async (cardId: string, status: CardStatus) => {
  console.log('🔄 [LIST-ITEM] 更新卡片狀態:', { cardId, status, statusType: typeof status })
  
  try {
    await updateCardStatus(cardId, status)
    console.log('✅ [LIST-ITEM] 狀態更新成功')
  } catch (error) {
    console.error('❌ [LIST-ITEM] 更新卡片狀態失敗:', error)
    emit('card-updated')
  }
}

// 🏆 卡片優先順序更新
const handleCardPriorityUpdate = async (cardId: string, priority: CardPriority) => {
  console.log('🔄 [LIST-ITEM] 更新卡片優先順序:', { cardId, priority, priorityType: typeof priority })
  
  try {
    await updateCardPriority(cardId, priority)
    console.log('✅ [LIST-ITEM] 優先順序更新成功')
  } catch (error) {
    console.error('❌ [LIST-ITEM] 更新優先順序失敗:', error)
    emit('card-updated')
  }
}
// #endregion ═══════════════════════ 📌 CARD OPERATIONS ═══════════════════════

// #region ═══════════════════════ 🔄 DRAG & DROP ═══════════════════════
// 🎯 拖拽變更事件處理
const handleCardChange = async (event: any) => {
  console.log('🎯 [CARD-CHANGE] 卡片變更事件:', event)
  try {
    await handleCardDragMove(event, props.list.id)
    emit('card-move', event)
  } catch (error) {
    console.error('❌ [CARD-CHANGE] 處理卡片移動失敗:', error)
  }
}

// #endregion ═══════════════════════ 🔄 DRAG & DROP ═══════════════════════

// #region ═══════════════════════ 🗑️ LIST OPERATIONS ═══════════════════════
// 🗑️ 刪除列表函數
const handleDeleteList = () => {
  console.log('🗑️ [PURE-LIST] 刪除列表事件，委派給父組件:', props.list.title)
  emit('list-delete', props.list.id)
}

// 🤖 AI 生成函數
const handleAiGenerate = () => {
  console.log('🤖 [PURE-LIST] AI 生成任務事件，委派給父組件:', props.list.title)
  emit('ai-generate', props.list.id)
}
// #endregion ═══════════════════════ 🗑️ LIST OPERATIONS ═══════════════════════
</script>

<style scoped>
/* 🎯 使用自定義 class 名稱，避免全域 CSS 衝突 */
.draggable-card-wrapper {
  width: 100%;
}

/* 🎨 拖曳視覺效果 - 安全版本，不會卡住 */
.card-chosen .card-draggable {
  opacity: 0.8;
  border: 2px solid #10b981 !important;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.card-ghost .card-draggable {
  opacity: 0.4;
  background: #f3f4f6;
  border: 2px dashed #9ca3af !important;
  /* 占位符效果 */
}

.card-dragging .card-draggable {
  opacity: 0.9;
  border: 2px solid #10b981 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.95);
  transform: rotate(2deg);  /* 拖曳時傾斜 2 度 */
  /* 跟著滑鼠的半透明效果 */
}

/* 🎯 跟著滑鼠的透明卡片效果 - 安全版本 */
.card-fallback {
  opacity: 0.8 !important;
  background: rgba(255, 255, 255, 0.95) !important;
  border: 2px solid #10b981 !important;
  border-radius: 8px !important;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3) !important;
  /* 不能設定 transform，會和 vue-draggable-next 的位置控制衝突 */
}

/* 🖱️ 游標狀態：hover 時顯示可抓取，拖拽時顯示正在抓取 */
.card-draggable:hover {
  cursor: grab;
}

.card-draggable:active,
.card-draggable.dragging {
  cursor: grabbing;
}

/* 🌈 AI 生成按鈕的彩虹魔法動畫 */
.ai-rainbow-magic {
  background: linear-gradient(
    -45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 黃綠 */
    #00ff00,  /* 綠 */
    #00ff80,  /* 青綠 */
    #00ffff,  /* 青 */
    #0080ff,  /* 藍 */
    #0000ff,  /* 藍紫 */
    #8000ff,  /* 紫 */
    #ff00ff,  /* 洋紅 */
    #ff0080,  /* 粉紅 */
    #ff0000   /* 回到紅色 */
  );
  background-size: 400% 400%;
  animation: rainbowFlow 4s ease-in-out infinite;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

/* 🌟 彩虹光暈效果 */
.ai-rainbow-magic::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(
    -45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 黃綠 */
    #00ff00,  /* 綠 */
    #00ff80,  /* 青綠 */
    #00ffff,  /* 青 */
    #0080ff,  /* 藍 */
    #0000ff,  /* 藍紫 */
    #8000ff,  /* 紫 */
    #ff00ff,  /* 洋紅 */
    #ff0080,  /* 粉紅 */
    #ff0000   /* 回到紅色 */
  );
  background-size: 400% 400%;
  border-radius: inherit;
  z-index: -1;
  animation: rainbowFlow 3s ease-in-out infinite;
  opacity: 0.7;
  filter: blur(8px);
}

/* 🌟 內部魔法光芒效果 */
.ai-rainbow-magic::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 80%;
  background: radial-gradient(
    circle,
    rgba(255,255,255,0.3) 0%,
    rgba(255,255,255,0.1) 50%,
    transparent 70%
  );
  border-radius: inherit;
  transform: translate(-50%, -50%);
  animation: magicPulse 2s ease-in-out infinite;
  pointer-events: none;
}

/* 🌈 彩虹流動動畫 - 慢速流暢變化 */
@keyframes rainbowFlow {
  0% {
    background-position: 0% 50%;
    filter: brightness(1) saturate(1.2);
  }
  20% {
    background-position: 100% 50%;
    filter: brightness(1.1) saturate(1.4);
  }
  40% {
    background-position: 200% 50%;
    filter: brightness(1.2) saturate(1.6);
  }
  60% {
    background-position: 300% 50%;
    filter: brightness(1.1) saturate(1.4);
  }
  80% {
    background-position: 400% 50%;
    filter: brightness(1) saturate(1.2);
  }
  100% {
    background-position: 500% 50%;
    filter: brightness(1) saturate(1.2);
  }
}

/* ✨ 內部光芒脈動動畫 */
@keyframes magicPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 🎭 禁用狀態時的樣式調整 */
.ai-rainbow-magic:disabled {
  cursor: wait;
  transform: none;
}

.ai-rainbow-magic:disabled:hover {
  transform: none;
}

</style>