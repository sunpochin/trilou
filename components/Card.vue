<template>
  <!-- 卡片組件 -->
  <div class="bg-white rounded px-3 py-3 mb-2 shadow-sm cursor-pointer transition-shadow duration-200 hover:shadow-md">
    <!-- 顯示模式：顯示卡片標題 -->
    <div 
      v-if="!isEditing" 
      @click="startEditing"
      class="min-h-6"
    >
      {{ card.title }}
    </div>
    
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
import { ref, nextTick } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

// 定義卡片資料型別
interface Card {
  id: string
  title: string
}

// 接收父組件傳入的卡片資料
const props = defineProps<{
  card: Card
}>()

// 取得 store 實例
const boardStore = useBoardStore()

// 編輯狀態管理
const isEditing = ref(false)
const editingTitle = ref('')
const editInput = ref<HTMLInputElement | null>(null)

// 開始編輯
const startEditing = () => {
  isEditing.value = true
  editingTitle.value = props.card.title
  
  // 下一個 tick 後聚焦到輸入框並選取所有文字
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  })
}

// 儲存編輯
const saveEdit = () => {
  const newTitle = editingTitle.value.trim()
  if (newTitle) {
    // 只要有內容就更新，不管是否與原標題相同
    boardStore.updateCardTitle(props.card.id, newTitle)
  } else {
    // 如果是空字串，恢復原始標題
    editingTitle.value = props.card.title
  }
  isEditing.value = false
}

// 取消編輯
const cancelEdit = () => {
  isEditing.value = false
  editingTitle.value = props.card.title
}
</script>