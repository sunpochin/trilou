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
          @keydown.enter="updateTitle"
        />
      </div>

      <!-- 描述編輯區域 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
        <textarea
          v-model="localDescription"
          :class="[
            'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-200',
            isDescriptionEditing ? 'min-h-32' : 'min-h-16'
          ]"
          :rows="isDescriptionEditing ? 6 : 2"
          placeholder="新增更詳細的描述..."
          @click="startDescriptionEdit"
        ></textarea>
      </div>

      <!-- 按鈕區域 - 只有在編輯描述時才顯示 -->
      <div v-if="isDescriptionEditing" class="flex justify-end gap-2">
        <button
          @click="cancelDescriptionEdit"
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
import { useCardActions } from '@/composables/useCardActions'

// 定義卡片資料型別
import type { CardUI } from '@/types'

// 使用統一的卡片型別定義
type Card = CardUI

// 接收父組件傳入的屬性
const props = defineProps<{
  show: boolean
  card: Card | null
}>()

// 定義事件
const emit = defineEmits<{
  close: []
}>()

// 使用卡片操作 composable（遵循依賴反轉原則）
const { updateCardTitle, updateCardDescription } = useCardActions()

// 本地編輯狀態
const localTitle = ref('')
const localDescription = ref('')
const isDescriptionEditing = ref(false)

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

// 更新標題（即時更新，不關閉模態框）
const updateTitle = async () => {
  if (props.card && localTitle.value.trim()) {
    try {
      await updateCardTitle(props.card.id, localTitle.value.trim())
    } catch (error) {
      console.error('更新標題失敗:', error)
      // 可以在這裡加入錯誤提示，但不阻止用戶繼續編輯
    }
  }
}

// 開始編輯描述
const startDescriptionEdit = () => {
  isDescriptionEditing.value = true
}

// 取消編輯描述
const cancelDescriptionEdit = () => {
  isDescriptionEditing.value = false
  // 恢復原始描述
  if (props.card) {
    localDescription.value = props.card.description || ''
  }
}

// 儲存變更（僅儲存描述）- 等待儲存完成再關閉模態框
const saveChanges = async () => {
  if (!props.card) return
  
  try {
    console.log('🔄 [MODAL] 開始儲存描述變更...')
    await updateCardDescription(props.card.id, localDescription.value.trim())
    console.log('✅ [MODAL] 描述儲存成功，關閉編輯模式')
    
    // 只有成功儲存後才關閉編輯模式和模態框
    isDescriptionEditing.value = false
    closeModal()
  } catch (error) {
    console.error('❌ [MODAL] 儲存描述失敗:', error)
    // 發生錯誤時不關閉模態框，讓用戶可以重新嘗試或取消
    // 可以在這裡加入用戶友好的錯誤提示
  }
}
</script>