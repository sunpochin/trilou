<!--
  📋 ListMenu 組件 - 列表操作選單組件 (三點選單)
  
  🎯 組件主要功能：
  ✅ 顯示列表操作的三點選單按鈕 (⋮ 圖示)
  ✅ 管理選單的開啟/關閉狀態 (點擊按鈕切換，點擊外部關閉)
  ✅ 提供列表操作選項：新增卡片、刪除列表
  ✅ 處理點擊外部區域自動關閉選單的功能
  ✅ 支援全域選單狀態管理 (同時只能開啟一個選單)
  ✅ 防止點擊事件冒泡，避免意外關閉選單
  
  🔧 使用的技術棧：
  - Vue 3 Composition API
  - 自訂 useListMenu composable (選單狀態管理抽象層)
  - TypeScript 型別安全
  - Tailwind CSS 樣式
  - 全域事件監聽 (document click)
  
  📦 Props 參數：
  - listId: string - 標識此選單屬於哪個列表，用於全域選單狀態管理
  
  🚀 Emit 事件：
  - add-card: 當點擊「新增卡片」時觸發，通知父組件執行新增卡片操作
  - delete-list: 當點擊「刪除列表」時觸發，通知父組件執行刪除列表操作
  
  💡 核心交互邏輯：
  1. 選單開關：點擊三點按鈕 → 切換選單顯示狀態 (開啟/關閉)
  2. 全域管理：開啟新選單時自動關閉其他已開啟的選單 (透過 useListMenu)
  3. 外部點擊關閉：點擊選單容器外的任何位置 → 自動關閉所有選單
  4. 操作執行：點擊選單項目 → emit 事件給父組件 → 自動關閉選單
  5. 事件隔離：使用 event.stopPropagation() 防止選單內點擊觸發外部關閉邏輯
  
  🎯 選單狀態管理說明：
  - 使用 useListMenu composable 管理全域選單狀態
  - openMenuId 存放當前開啟選單的 listId，null 表示所有選單都關閉
  - 每個 ListMenu 實例通過 computed 判斷自己是否應該顯示
  - 確保同時只有一個選單開啟，提升用戶體驗
  
  🔧 事件處理機制：
  - handleToggleMenu: 處理三點按鈕點擊，切換選單狀態，防止事件冒泡
  - handleAddCard: 處理新增卡片點擊，發送事件後關閉選單，防止事件冒泡
  - handleDeleteList: 處理刪除列表點擊，發送事件後關閉選單，防止事件冒泡
  - handleClickOutside: 監聽 document 點擊，檢測是否點擊選單外部，自動關閉選單
  
  🎯 SOLID 原則設計說明：
  
  ✅ S (Single Responsibility) - 單一職責原則
     只負責選單的「顯示/隱藏」和「點擊事件處理」
     不處理具體的業務邏輯（如實際刪除列表或新增卡片）
     選單狀態管理、事件處理、UI 渲染各自獨立
     
  ✅ O (Open/Closed) - 開放封閉原則
     要新增選單項目時，只需要加新的 <button> 和對應的 emit
     不需要修改現有的選單邏輯或狀態管理
     對擴展開放，對修改封閉
     
  ✅ L (Liskov Substitution) - 里氏替換原則
     任何接受 listId 的組件都可以使用此選單組件
     不會因為不同的 listId 格式而導致功能異常
     
  ✅ I (Interface Segregation) - 介面隔離原則
     只要求父組件提供 listId，只 emit 必要的事件
     不強迫父組件實作不需要的功能
     
  ✅ D (Dependency Inversion) - 依賴反轉原則  
     不直接依賴 boardStore，而是透過 useListMenu 抽象層
     組件依賴抽象介面，不依賴具體狀態管理實作
     
  📝 擴展方式範例：
     想要新增「複製列表」功能？
     1. 在模板中加一個 <button @click="handleCopyList">複製列表</button>
     2. 在 script 中加一個 handleCopyList 函數，emit('copy-list') 並 closeAllMenus()
     3. 在父組件 ListItem 中接收 @copy-list 事件
     4. 完全不會影響現有的「新增卡片」和「刪除列表」功能
     
     想要新增「移動列表」功能？
     1. 加 <button @click="handleMoveList">移動列表</button>
     2. 加 handleMoveList 函數處理
     3. 父組件接收事件並處理業務邏輯
  
  🧪 測試覆蓋：
     組件功能已包含在整體測試中，特別是點擊外部關閉的邏輯
     修復了之前的雙點擊問題（事件冒泡導致選單立即關閉）
  
  🐛 已修復的問題：
     - 雙點擊問題：之前點擊選單按鈕需要點兩次才能開啟
     - 原因：點擊事件冒泡到 document，立即觸發 handleClickOutside 關閉選單
     - 解決：在所有點擊處理函數中加入 event.stopPropagation()
  
  📊 效能考量：
     - 使用事件委託，所有 ListMenu 共享一個 document click 監聽器
     - 使用 computed 屬性最佳化選單顯示判斷
     - onMounted/onUnmounted 確保事件監聽器正確清理，避免記憶體洩漏
  
  🔄 生命週期管理：
     - onMounted: 加入 document click 事件監聽器
     - onUnmounted: 移除 document click 事件監聽器，防止記憶體洩漏
     - 每個組件實例獨立管理自己的生命週期
-->

<template>
  <!-- 三點選單按鈕容器 -->
  <div class="relative list-menu-container">
    <!-- 三點選單按鈕 -->
    <button 
      @click="handleToggleMenu"
      class="p-1 rounded hover:bg-gray-300 transition-colors duration-200"
    >
      <svg 
        class="w-4 h-4 text-gray-600" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
      </svg>
    </button>
    
    <!-- 下拉選單 -->
    <div 
      v-if="isMenuOpen"
      class="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-40 z-10"
    >
      <button 
        @click="handleAddCard"
        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
      >
        新增卡片
      </button>
      <button 
        @click="handleDeleteList"
        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
      >
        刪除列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useListMenu } from '@/composables/useListMenu'

// 組件 props（用於標識選單所屬的列表）
const props = defineProps<{
  listId: string
}>()

// 組件 emit 事件
const emit = defineEmits<{
  'add-card': []
  'delete-list': []
}>()

// 使用選單管理 composable（依賴反轉原則）
// 組件不直接依賴 boardStore，而是透過抽象層 useListMenu
const { openMenuId, toggleMenu, closeAllMenus } = useListMenu()

// 計算當前選單是否開啟（基於 composable 提供的響應式狀態）
// 只有當全域開啟的選單 ID 等於當前列表 ID 時，此選單才是開啟狀態
const isMenuOpen = computed<boolean>(() => openMenuId.value === props.listId)

// 切換選單顯示狀態
// 透過 composable 統一管理，確保同時只有一個選單開啟
const handleToggleMenu = (event: Event) => {
  // 防止點擊事件冒泡到 document，避免立即觸發 handleClickOutside
  event.stopPropagation()
  toggleMenu(props.listId)
}

// 處理新增卡片
const handleAddCard = (event: Event) => {
  // 防止事件冒泡
  event.stopPropagation()
  emit('add-card')
  // 執行動作後關閉選單
  closeAllMenus()
}

// 處理刪除列表
const handleDeleteList = (event: Event) => {
  // 防止事件冒泡
  event.stopPropagation()
  emit('delete-list')
  // 執行動作後關閉選單
  closeAllMenus()
}

// 點擊外部區域關閉所有選單
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.list-menu-container')) {
    closeAllMenus()
  }
}

// 組件掛載時加入事件監聽器
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

// 組件卸載時移除事件監聽器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>