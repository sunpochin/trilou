<!--
  列表選單組件 - 負責列表操作選單的顯示與互動
  
  🎯 SOLID 原則設計說明：
  
  ✅ S (Single Responsibility) - 單一職責原則
     只負責選單的「顯示/隱藏」和「點擊事件處理」
     不處理具體的業務邏輯（如實際刪除列表）
     
  ✅ O (Open/Closed) - 開放封閉原則
     要新增選單項目時，只需要加新的 <button> 和對應的 emit
     不需要修改現有的選單邏輯或狀態管理
     
  📝 擴展範例：
     想要新增「複製列表」功能？
     1. 加一個 <button @click="emit('copy-list')">複製列表</button>
     2. 在父組件接收 @copy-list 事件
     3. 完全不會影響現有的「新增卡片」和「刪除列表」功能
-->

<template>
  <!-- 三點選單按鈕容器 -->
  <div class="relative list-menu-container">
    <!-- 三點選單按鈕 -->
    <button 
      @click="toggleMenu"
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
import { ref, onMounted, onUnmounted } from 'vue'

// 組件 props（用於標識選單所屬的列表）
defineProps<{
  listId: string
}>()

// 組件 emit 事件
const emit = defineEmits<{
  'add-card': []
  'delete-list': []
}>()

// 選單開關狀態
const isMenuOpen = ref(false)

// 切換選單顯示狀態
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// 處理新增卡片
const handleAddCard = () => {
  emit('add-card')
  isMenuOpen.value = false
}

// 處理刪除列表
const handleDeleteList = () => {
  emit('delete-list')
  isMenuOpen.value = false
}

// 點擊外部區域關閉選單
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.list-menu-container')) {
    isMenuOpen.value = false
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