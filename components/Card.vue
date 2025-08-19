<template>
  <!-- 卡片組件 -->
  <div class="bg-white rounded px-3 py-3 mb-2 shadow-sm transition-shadow duration-200 hover:shadow-md relative group">
    <!-- 顯示模式：顯示卡片標題 -->
    <div 
      v-if="!isEditing" 
      @click="openCardModal"
      @dblclick="startEditing"
      class="min-h-6 cursor-pointer pr-8"
    >
      {{ card.title }}, pos: {{ card.position }}, id: {{ card.id }}
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
import { useBoardStore } from '@/stores/boardStore'
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

// 開啟卡片模態框
const openCardModal = () => {
  emit('openModal', props.card)
}

// 刪除卡片功能
const deleteCard = async () => {
  console.log('🗑️ [CARD] deleteCard 被呼叫，卡片:', props.card)
  
  // 顯示確認對話框
  console.log('💬 [CARD] 顯示刪除確認對話框...')
  if (!confirm(`確定要刪除卡片 "${props.card.title}" 嗎？此操作無法撤銷。`)) {
    console.log('❌ [CARD] 用戶取消刪除操作')
    return
  }
  
  console.log('✅ [CARD] 用戶確認刪除，開始執行刪除流程...')
  
  try {
    console.log('📤 [CARD] 發送 DELETE API 請求到:', `/api/cards/${props.card.id}`)
    
    // 為了 UI 美觀，「先」從本地狀態中移除卡片（需要找到卡片所屬的列表）
    console.log('🔄 [CARD] 更新本地狀態，從列表中移除卡片...')
    
    // 遍歷所有列表找到包含此卡片的列表
    for (const list of boardStore.board.lists) {
      const cardIndex = list.cards.findIndex(card => card.id === props.card.id)
      if (cardIndex !== -1) {
        console.log(`📋 [CARD] 在列表 "${list.title}" 中找到卡片，索引: ${cardIndex}`)
        list.cards.splice(cardIndex, 1)
        console.log('✅ [CARD] 卡片已從本地狀態移除')
        break
      }
    }
    
    // 「再」直接呼叫 API 刪除卡片
    await $fetch(`/api/cards/${props.card.id}`, {
      method: 'DELETE'
    })
    console.log('✅ [CARD] API 刪除請求成功')
    
    console.log('🎉 [CARD] 卡片刪除流程完成')
    
  } catch (error) {
    console.error('❌ [CARD] 刪除卡片過程中發生錯誤:')
    console.error('  🔍 錯誤類型:', typeof error)
    console.error('  🔍 錯誤內容:', error)
    
    if (error && typeof error === 'object') {
      console.error('  🔍 錯誤詳情:', {
        message: (error as any).message,
        statusCode: (error as any).statusCode,
        statusMessage: (error as any).statusMessage,
        data: (error as any).data
      })
    }
    
    // 顯示錯誤訊息給用戶
    alert('刪除卡片失敗，請稍後再試')
    console.log('💥 [CARD] 錯誤處理完成')
  }
}
</script>