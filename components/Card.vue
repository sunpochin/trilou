<!--
  🃏 Card 組件 - 單張卡片渲染組件
  
  ======================== 功能定位 ========================
  
  🎯 這個組件負責什麼？
  ✅ 渲染「單張卡片」的外觀和基本交互
  ✅ 處理卡片的勾選狀態（checkbox）
  ✅ 顯示卡片標題、描述圖示、到期日等資訊
  ✅ 提供卡片的點擊、刪除等基本操作
  ❌ 不負責拖拽邏輯（由 ListItem 的 draggable 處理）
  ❌ 不負責資料更新（只發送事件給父組件）
  
  ======================== 與 ListItem 的差別 ========================
  
  📋 ListItem.vue（列表組件）：
  - 負責「整個列表」的管理
  - 包含多張卡片
  - 處理拖拽排序邏輯（透過 vue-draggable-next）
  - 管理列表標題、新增卡片等列表層級功能
  - 架構：列表容器 > draggable > 多個 Card 組件
  
  🃏 Card.vue（卡片組件）：
  - 只負責「單張卡片」的顯示
  - 被 ListItem 使用的子組件
  - 純渲染組件，不處理複雜邏輯
  - 透過事件向上傳遞用戶操作
  - 架構：單一卡片的 UI 元素
  
  ======================== 十歲小朋友解釋 ========================
  
  🏠 想像一個書架（ListItem）：
  - 書架可以放很多本書
  - 書架有標題（例如：「科學類」）
  - 你可以在書架間搬動書本
  - 書架底部有「加新書」的按鈕
  
  📚 每本書（Card）：
  - 顯示書名
  - 可以打勾標記「已讀」
  - 點擊可以看詳細內容
  - 可以刪除這本書
  
  ListItem = 書架（管理所有書）
  Card = 單本書（只管自己的顯示）
  
  ======================== Props 接收 ========================
  - card: 卡片資料物件
  - dragging: 是否正在拖拽中
  - isMobile: 是否為手機版
  
  ======================== Events 發送 ========================
  - open-modal: 開啟卡片詳細編輯
  - delete: 刪除卡片
  - update-title: 更新卡片標題（inline 編輯）
  - updateStatus: 更新卡片狀態（Todo/Doing/Done）
  - updatePriority: 更新卡片優先順序（High/Medium/Low）
  
  ======================== 使用範例 ========================
  在 ListItem.vue 中被這樣使用：
  <Card 
    :card="card" 
    :dragging="dragging"
    :is-mobile="isMobile"
    @open-modal="$emit('open-card-modal', card)"
    @delete="$emit('card-delete', card)"
    @updateStatus="handleCardStatusUpdate"
    @updatePriority="handleCardPriorityUpdate"
  />

  ======================== 📱 跨裝置顯示問題解決 ========================
  
  🧒 十歲小朋友解釋：為什麼同樣的卡片在不同手機上看起來不一樣？
  
  🎨 想像你在不同的紙上畫同一張圖：
  - 有些紙比較厚，字會看起來粗一點（不同手機的螢幕密度）
  - 有些筆寫出來的字比較大（不同手機的預設字體）
  - 有些紙比較小，圖可能會擠在一起（不同螢幕尺寸）
  
  💡 解決方法就像準備一個「萬能工具箱」：
  - 🔧 max-w-full: 告訴卡片「不可以比容器還寬」（像給圖片設邊界）
  - 📝 break-words: 如果文字太長，就自動換行（像寫字寫到邊緣就換下一行）
  - 🎯 whitespace-nowrap: 按鈕文字不准換行（保持按鈕整齊）
  - ✨ font-smoothing: 讓所有手機的字體都變得一樣漂亮（統一字體顯示效果）
  - 📏 響應式設計: 小螢幕自動使用小一點的字體和按鈕（像衣服有 S/M/L 不同尺寸）
  
  🔍 常見問題：
  - Redmi 10C + Chrome: 顯示正常 ✅
  - Redmi 10C + Firefox: 卡片太寬 → 用 min-width: 0 和 flex-shrink: 1 修正
  - Galaxy S53: 顯示正常 → 確保修改不會影響正常顯示
  - Chrome DevTools: 開發工具正常 → 保持桌面版的相容性
  
  🦊 Firefox 特殊處理：
  - Firefox 對 flexbox 寬度計算比 Chrome 更嚴格
  - 需要明確告訴 Firefox「這個元素可以收縮」(flex-shrink: 1)
  - 需要明確告訴 Firefox「最小寬度是 0」(min-width: 0)
  - 加上 overflow-hidden 防止內容溢出
  
  💭 記住：好的設計就像魔術一樣，在任何裝置和任何瀏覽器上都能完美顯示！
-->

<template>
  <!-- 🎯 純渲染卡片組件 - 共用 mobile/desktop -->
  <div 
    class="bg-white rounded px-3 py-3 mb-2 shadow-sm transition-all duration-200 hover:shadow-md relative group min-h-16 cursor-pointer card-draggable focus:outline-none max-w-full overflow-hidden"
    :class="{ 'card-dragging': dragging }"
    @click="openCardModal"
    tabindex="-1"
  >
    <!-- 顯示模式：顯示卡片標題 -->
    <div 
      v-if="!isEditing" 
      class="min-h-6 pr-8 pb-6 relative"
    >
      <!-- 勾選框 - 永久顯示已勾選狀態，hover 時顯示未勾選 -->
      <div 
        class="absolute left-0 top-0.5 flex-shrink-0 w-4 h-4 transition-all duration-200 z-10"
        :class="isChecked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
        @click.stop="toggleCheckbox"
      >
        <div 
          class="w-full h-full rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200"
          :class="isChecked ? 'bg-green-500 border-green-500' : 'border-gray-400 hover:border-gray-600'"
        >
          <svg 
            v-if="isChecked"
            class="w-2.5 h-2.5 text-white" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
      </div>
      
      <!-- 卡片標題 - 酷炫的位移效果：未 hover 時佔滿寬度，hover 時往右讓出空間 -->
      <div 
        class="transition-all duration-200 break-words overflow-hidden"
        :class="{ 
          'text-gray-500': isChecked,
          'ml-0 group-hover:ml-6': !isChecked,
          'ml-6': isChecked
        }"
      >
        {{ card.title }}
      </div>
    </div>
      <!-- @dblclick="startEditing" -->
    
    <!-- 底部圖示區域 -->
    <div v-if="!isEditing" class="absolute bottom-2 left-3 right-3 flex justify-between items-center">
      <!-- 左下角：描述圖示（當有描述時顯示） -->
      <div v-if="card.description && card.description.trim()" class="flex items-center">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
        </svg>
      </div>
      <div v-else></div>
      
      <!-- 右下角：狀態和優先順序按鈕 -->
      <div class="flex gap-2 flex-shrink-0">
        <!-- 狀態按鈕 -->
        <button
          @click.stop="toggleStatus"
          class="text-xs px-2 py-1 rounded-sm font-medium transition-colors whitespace-nowrap"
          :class="getStatusClass(card.status || CardStatus.TODO)"
        >
          {{ getStatusLabel(card.status || CardStatus.TODO) }}
        </button>
        
        <!-- 優先順序按鈕 -->
        <button
          @click.stop="togglePriority"
          class="flex items-center gap-1 text-xs px-2 py-1 rounded-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
        >
          <span>{{ getPriorityEmoji(card.priority || CardPriority.MEDIUM) }}</span>
          <span>{{ getPriorityLabel(card.priority || CardPriority.MEDIUM) }}</span>
        </button>
      </div>
    </div>
    
    <!-- 刪除按鈕 - 只在 hover 時顯示 -->
    <button 
      v-if="!isEditing"
      @click.stop="deleteCard"
      class="absolute top-2 right-2 p-1 rounded hover:bg-red-100 transition-colors duration-200 opacity-100' : 'opacity-0 group-hover:opacity-100"
      title="刪除卡片"
    >
      <svg 
        class="w-4 h-4 text-red-600 hover:text-red-800" 
        fill="none"
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
    
    <!-- 編輯模式：顯示輸入框 -->
    <input
      v-else
      ref="editInput"
      v-model="editingTitle"
      @keydown.enter="saveEdit"
      @keydown.escape="cancelEdit"
      @blur="saveEdit"
      class="w-full bg-transparent border-none outline-none min-h-6"
      type="text"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatStatus, getStatusTagClass } from '@/utils/statusFormatter'
import type { CardUI } from '@/types'
import { CardStatus, CardPriority } from '@/types/api'

// 使用統一的卡片型別定義
type Card = CardUI

// 🎯 純渲染組件：接收父組件傳入的資料和狀態
const props = defineProps<{
  card: Card
  dragging: boolean  // 父組件控制的拖拽狀態
  isMobile?: boolean  // 是否為手機版
}>()

// 🎯 純渲染組件：定義事件 (父組件處理邏輯)
const emit = defineEmits<{
  openModal: [card: Card]
  delete: [card: Card]
  updateTitle: [cardId: string, newTitle: string]
  dragStart: [card: Card, type: 'card']
  dragEnd: []
  updateStatus: [cardId: string, status: CardStatus]
  updatePriority: [cardId: string, priority: CardPriority]
}>()


// 編輯狀態管理
const isEditing = ref(false)
const editingTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// 勾選狀態管理
const isChecked = ref(false)

// 🎯 純渲染：切換勾選狀態（本地 UI 狀態）
const toggleCheckbox = () => {
  isChecked.value = !isChecked.value
  console.log(`📋 [PURE-CARD] 本地勾選狀態: ${props.card.title} -> ${isChecked.value ? '已完成' : '未完成'}`)
  // 純渲染組件不處理業務邏輯，只管理 UI 狀態
}

// 開始編輯（目前已停用，但保留以備後用）
// const startEditing = () => {
//   isEditing.value = true
//   editingTitle.value = props.card.title
//   
//   // 下一個 tick 後聚焦到輸入框並選取所有文字
//   nextTick(() => {
//     if (editInput.value) {
//       editInput.value.focus()
//       editInput.value.select()
//     }
//   })
// }

// 🎯 純渲染：儲存編輯 (委派給父組件)
const saveEdit = () => {
  const newTitle = editingTitle.value.trim()
  if (newTitle && newTitle !== props.card.title) {
    // 委派給父組件處理業務邏輯
    emit('updateTitle', props.card.id, newTitle)
  } else {
    // 如果是空字串或無變化，恢復原始標題
    editingTitle.value = props.card.title
  }
  isEditing.value = false
}

// 取消編輯
const cancelEdit = () => {
  isEditing.value = false
  editingTitle.value = props.card.title
}

// 🎯 純渲染：開啟卡片模態框
const openCardModal = () => {
  emit('openModal', props.card)
}

// 🎯 純渲染：刪除卡片 (委派給父組件)
const deleteCard = () => {
  console.log('🗑️ [PURE-CARD] 刪除事件，委派給父組件:', props.card.title)
  emit('delete', props.card)
}

// 狀態標籤樣式
const getStatusClass = (status: CardStatus) => {
  switch (status) {
    case CardStatus.TODO:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    case CardStatus.DOING:
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    case CardStatus.DONE:
      return 'bg-green-100 text-green-700 hover:bg-green-200'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }
}

// 狀態標籤文字
const getStatusLabel = (status: CardStatus) => {
  switch (status) {
    case CardStatus.TODO:
      return 'Todo'
    case CardStatus.DOING:
      return 'Doing'
    case CardStatus.DONE:
      return 'Done'
    default:
      return 'Todo'
  }
}

// 優先順序 emoji
const getPriorityEmoji = (priority: CardPriority) => {
  switch (priority) {
    case CardPriority.HIGH:
      return '🔴'
    case CardPriority.MEDIUM:
      return '🟡'
    case CardPriority.LOW:
      return '🟢'
    default:
      return '🟡'
  }
}

// 優先順序標籤
const getPriorityLabel = (priority: CardPriority) => {
  switch (priority) {
    case CardPriority.HIGH:
      return 'High'
    case CardPriority.MEDIUM:
      return 'Medium'
    case CardPriority.LOW:
      return 'Low'
    default:
      return 'Medium'
  }
}

// 切換狀態（循環：Todo → Doing → Done → Todo）
const toggleStatus = () => {
  const currentStatus = props.card.status || CardStatus.TODO
  let newStatus: CardStatus
  
  switch (currentStatus) {
    case CardStatus.TODO:
      newStatus = CardStatus.DOING
      break
    case CardStatus.DOING:
      newStatus = CardStatus.DONE
      break
    case CardStatus.DONE:
      newStatus = CardStatus.TODO
      break
    default:
      newStatus = CardStatus.TODO
  }
  
  emit('updateStatus', props.card.id, newStatus)
}

// 切換優先順序（循環：High → Medium → Low → High）
const togglePriority = () => {
  const currentPriority = props.card.priority || CardPriority.MEDIUM
  let newPriority: CardPriority
  
  switch (currentPriority) {
    case CardPriority.HIGH:
      newPriority = CardPriority.MEDIUM
      break
    case CardPriority.MEDIUM:
      newPriority = CardPriority.LOW
      break
    case CardPriority.LOW:
      newPriority = CardPriority.HIGH
      break
    default:
      newPriority = CardPriority.MEDIUM
  }
  
  emit('updatePriority', props.card.id, newPriority)
}

</script>

<style scoped>
/* 🎯 防止卡片出現藍色外框 - 解決拖拽後的 focus 問題 */
.card-draggable {
  outline: none !important;
  /* 確保卡片不會超出容器寬度 */
  box-sizing: border-box;
  word-wrap: break-word;
  /* 針對不同裝置的字體渲染一致性 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* 🦊 Firefox 專用修正：強制容器寬度限制 */
  min-width: 0;
  flex-shrink: 1;
  /* 🦊 Firefox 對 flexbox 計算方式不同，需要明確指定 */
  width: 100%;
  max-width: 100%;
}

.card-draggable:focus {
  outline: none !important;
  /* 保持原有的 shadow，只移除可能的藍色邊框 */
}

/* 🎯 確保拖拽過程中不會出現藍色邊框 */
.card-draggable.sortable-chosen,
.card-draggable.sortable-ghost {
  outline: none !important;
}

/* 🎯 防止瀏覽器預設的選取樣式造成藍色外框 */
.card-draggable::selection {
  background: transparent;
}

.card-draggable::-moz-selection {
  background: transparent;
}

/* 🎯 針對可能的拖拽庫樣式覆蓋 */
.card-draggable[data-sortable] {
  outline: none !important;
}

/* 
🎯 針對不同裝置的響應式字體調整 
🧒 十歲小朋友解釋：就像衣服有不同尺寸，網頁在小螢幕上也要用小一點的字體和按鈕
*/
@media screen and (max-width: 768px) {
  .card-draggable {
    font-size: 14px;        /* 📱 手機用稍微小一點的字體 */
    min-width: 0;           /* 🔧 允許卡片收縮到最小寬度 */
    width: 100%;            /* 📏 確保卡片佔滿容器寬度 */
  }
  
  /* 🔘 確保按鈕在小螢幕上不會太擠 */
  .card-draggable button {
    font-size: 11px;        /* 📱 按鈕文字更小一點 */
    padding: 4px 8px;       /* 📏 按鈕內距縮小，避免擠在一起 */
  }
}

/* 🦊 Firefox 專用強制性修正 - 針對 Redmi 10C 的寬度問題 */
@-moz-document url-prefix() {
  .card-draggable {
    max-width: 100% !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    display: block !important;
  }
  
  .card-draggable * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
}

/*
🎨 跨裝置和跨瀏覽器相容性說明：
- 這些樣式確保卡片在 Redmi 10C、Galaxy S53、iPhone 等不同裝置上都能正常顯示
- font-smoothing 讓字體在不同 Android 版本上看起來一致
- break-words 防止長文字撐破卡片
- 響應式設計讓小螢幕自動調整元素大小

🦊 Firefox vs 🌟 Chrome 差異處理：
- Firefox 對 flexbox 的寬度計算更嚴格，需要明確設定 min-width: 0
- Chrome 比較寬鬆，會自動處理容器溢出問題
- 加上 overflow-hidden 確保兩個瀏覽器都能正確裁切內容
- flex-shrink: 1 讓 Firefox 知道這個元素可以收縮
- @-moz-document 是 Firefox 專用的強制性修正，確保在 Redmi 10C 上正常顯示

🧒 十歲小朋友解釋：
就像不同品牌的尺子可能有細微差異，Firefox 和 Chrome 測量寬度的方式也稍微不同
我們要給兩種尺子都能理解的明確指示！
現在還加上了「Firefox 專用說明書」，確保它一定聽得懂！
*/
</style>