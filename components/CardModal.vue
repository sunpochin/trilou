<template>
  <!-- 模態框背景遮罩 -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeModal"
  >
    <!-- 模態框內容 -->
    <div 
      class="bg-white rounded-lg p-6 w-96 max-w-full mx-4"
      @click.stop
    >
      <!-- 標題編輯區域 -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">卡片標題</label>
        <input
          v-model="localTitle"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="輸入卡片標題..."
        />
      </div>

      <!-- 描述編輯區域 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
        <textarea
          v-model="localDescription"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="4"
          placeholder="新增更詳細的描述..."
        ></textarea>
      </div>

      <!-- 按鈕區域 -->
      <div class="flex justify-end gap-2">
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button
          @click="saveChanges"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          儲存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

// 定義卡片資料型別
interface Card {
  id: string
  title: string
  description?: string
}

// 接收父組件傳入的屬性
const props = defineProps<{
  show: boolean
  card: Card | null
}>()

// 定義事件
const emit = defineEmits<{
  close: []
}>()

// 取得 store 實例
const boardStore = useBoardStore()

// 本地編輯狀態
const localTitle = ref('')
const localDescription = ref('')

// 監聽卡片變化，更新本地狀態
watch(() => props.card, (newCard) => {
  if (newCard) {
    localTitle.value = newCard.title
    localDescription.value = newCard.description || ''
  }
}, { immediate: true })

// 關閉模態框
const closeModal = () => {
  emit('close')
}

// 儲存變更
const saveChanges = () => {
  if (props.card && localTitle.value.trim()) {
    // 更新標題
    boardStore.updateCardTitle(props.card.id, localTitle.value.trim())
    // 更新描述
    boardStore.updateCardDescription(props.card.id, localDescription.value.trim())
    closeModal()
  }
}
</script>