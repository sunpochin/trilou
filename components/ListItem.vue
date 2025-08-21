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
-->

<template>
  <!-- 單個列表容器 -->
  <div class="bg-gray-200 rounded w-80 p-2 flex-shrink-0" :data-list-id="list.id">
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
    
    <!-- 可拖拉的卡片容器 -->
    <draggable
      class="min-h-5"
      :list="list.cards"
      group="cards"
      tag="div"
      @change="$emit('card-move', $event)"
    >
      <div v-for="card in list.cards" :key="card.id">
        <Card :card="card" @open-modal="$emit('open-card-modal', card)" />
      </div>
    </draggable>
    
    <!-- 新增卡片按鈕 -->
    <button 
      class="w-full p-3 bg-transparent border-2 border-dashed border-gray-300 rounded text-gray-600 cursor-pointer text-sm mt-2 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800" 
      @click="handleAddCard"
    >
      + 新增卡片
    </button>
  </div>
</template>

<script setup lang="ts">
import Card from '@/components/Card.vue'
import ListMenu from '@/components/ListMenu.vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useListActions } from '@/composables/useListActions'
import { ref, nextTick } from 'vue'

// 使用統一的型別定義
import type { ListUI } from '@/types'
type List = ListUI

// 組件 props
const props = defineProps<{
  list: List
}>()

// 組件 emit 事件
defineEmits<{
  'card-move': [event: any]
  'open-card-modal': [card: any]
}>()

// 使用列表操作邏輯 - 透過 composable 統一處理所有列表相關操作
const { addCard, deleteList, updateListTitle } = useListActions()

// 編輯狀態
const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInput = ref<HTMLInputElement | null>(null)

// 處理新增卡片
const handleAddCard = () => {
  addCard(props.list.id)
}

// 處理刪除列表
const handleDeleteList = () => {
  deleteList(props.list.id)
}

// 開始編輯標題
const startEditTitle = async () => {
  isEditingTitle.value = true
  editingTitle.value = props.list.title
  
  // 等待 DOM 更新後聚焦並全選文字
  await nextTick()
  if (titleInput.value) {
    titleInput.value.focus()
    titleInput.value.select()
  }
}

// 儲存標題變更 - 透過 composable 統一處理
const saveTitle = async () => {
  if (editingTitle.value.trim() && editingTitle.value.trim() !== props.list.title) {
    try {
      await updateListTitle(props.list.id, editingTitle.value.trim())
    } catch (error) {
      console.error('更新列表標題失敗:', error)
      // 失敗時恢復原始標題
      editingTitle.value = props.list.title
    }
  }
  isEditingTitle.value = false
}

// 取消編輯
const cancelEdit = () => {
  editingTitle.value = props.list.title
  isEditingTitle.value = false
}
</script>