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
  
  ======================== 使用範例 ========================
  在 ListItem.vue 中被這樣使用：
  <Card 
    :card="card" 
    :dragging="dragging"
    :is-mobile="isMobile"
    @open-modal="$emit('open-card-modal', card)"
    @delete="$emit('card-delete', card)"
  />
-->

<template>
  <!-- 🎯 純渲染卡片組件 - 共用 mobile/desktop -->
  <div 
    class="bg-white rounded px-3 py-3 mb-2 shadow-sm transition-all duration-200 hover:shadow-md relative group min-h-16 cursor-pointer card-draggable"
    :class="{ 'card-dragging': dragging }"
    @click="openCardModal"
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
        class="transition-all duration-200"
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
      
      <!-- 右下角：標籤區域 -->
      <div class="flex gap-1">
        <span 
          class="text-xs px-2 py-1 rounded-sm font-medium"
          :class="getStatusTagClass(card.status || 'medium')"
        >
          {{ formatStatus(card.status || 'medium') }}
        </span>
      </div>
    </div>
    
    <!-- 刪除按鈕 - 只在 hover 時顯示 -->
    <button 
      v-if="!isEditing"
      @click.stop="deleteCard"
      class="absolute top-2 right-2 p-1 rounded hover:bg-red-100 transition-colors duration-200"
      :class="isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
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

</script>