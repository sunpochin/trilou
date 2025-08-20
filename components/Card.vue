<template>
  <!-- 卡片組件 -->
  <div class="bg-white rounded px-3 py-3 mb-2 shadow-sm transition-shadow duration-200 hover:shadow-md relative group min-h-16 cursor-pointer"
    @click="openCardModal"
  >
    <!-- 顯示模式：顯示卡片標題 -->
    <div 
      v-if="!isEditing" 
      class="min-h-6 pr-8 pb-6"
    >
      {{ card.title }}  (pos: {{ card.position }})
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
          v-if="card.status"
          class="text-xs px-2 py-1 rounded-sm font-medium"
          :class="getStatusTagClass(card.status)"
        >
          {{ formatStatus(card.status) }}
        </span>
        <span 
          v-else
          class="bg-gray-400 text-white text-xs px-2 py-1 rounded-sm"
        >
          一般
        </span>
      </div>
    </div>
    
    <!-- 刪除按鈕 - 只在 hover 時顯示 -->
    <button 
      v-if="!isEditing"
      @click.stop="deleteCard"
      class="absolute top-2 right-2 p-1 rounded hover:bg-red-100 transition-colors duration-200 opacity-0 group-hover:opacity-100"
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
import { ref, nextTick } from 'vue'
import { useCardActions } from '@/composables/useCardActions'
import type { CardUI } from '@/types'

// 使用統一的卡片型別定義
type Card = CardUI

// 接收父組件傳入的卡片資料
const props = defineProps<{
  card: Card
}>()

// 定義事件
const emit = defineEmits<{
  openModal: [card: Card]
}>()


// 取得卡片操作功能
const { deleteCard: deleteCardAction, updateCardTitle: updateCardTitleAction } = useCardActions()

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
    updateCardTitleAction(props.card.id, newTitle)
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

// 開啟卡片模態框
const openCardModal = () => {
  emit('openModal', props.card)
}

// 刪除卡片功能
const deleteCard = async () => {
  console.log('🗑️ [CARD] deleteCard 被呼叫，卡片:', props.card)
  
  // 顯示漂亮的確認對話框
  console.log('💬 [CARD] 顯示刪除確認對話框...')
  // 委託給 composable 處理完整的刪除流程
  await deleteCardAction(props.card)
}

// 格式化 status 顯示文字
const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'todo': '待辦',
    'in-progress': '進行中',
    'done': '完成',
    'blocked': '阻塞',
    'review': '審核中',
    'testing': '測試中'
  }
  return statusMap[status] || status
}

// 取得 status tag 的 CSS 類別
const getStatusTagClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    'todo': 'bg-gray-500 text-white',
    'in-progress': 'bg-blue-500 text-white',
    'done': 'bg-green-500 text-white',
    'blocked': 'bg-red-500 text-white',
    'review': 'bg-yellow-500 text-white',
    'testing': 'bg-purple-500 text-white'
  }
  return statusClasses[status] || 'bg-gray-400 text-white'
}
</script>