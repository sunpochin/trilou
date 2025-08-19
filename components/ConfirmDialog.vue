<template>
  <!-- 確認對話框背景遮罩 -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="cancel"
  >
    <!-- 確認對話框內容 -->
    <div 
      class="bg-white rounded-lg p-6 w-96 max-w-full mx-4 shadow-xl transform transition-all duration-200 scale-100"
      @click.stop
    >
      <!-- 圖標區域 -->
      <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
        <svg 
          class="w-6 h-6 text-red-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <!-- 標題 -->
      <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
        {{ title || '確認操作' }}
      </h3>

      <!-- 訊息內容 -->
      <p class="text-sm text-gray-600 text-center mb-6">
        {{ message }}
      </p>

      <!-- 按鈕區域 -->
      <div class="flex gap-3 justify-end">
        <!-- 取消按鈕 -->
        <button 
          @click="cancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
        >
          {{ cancelText || '取消' }}
        </button>
        
        <!-- 確認按鈕 -->
        <button 
          @click="confirm"
          :class="[
            'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 transition-colors duration-200',
            dangerMode 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          ]"
        >
          {{ confirmText || '確認' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 確認對話框組件的 Props 定義
interface Props {
  show: boolean           // 是否顯示對話框
  title?: string          // 對話框標題
  message: string         // 確認訊息
  confirmText?: string    // 確認按鈕文字
  cancelText?: string     // 取消按鈕文字
  dangerMode?: boolean    // 是否為危險操作（紅色主題）
}

// 定義 Props 預設值
withDefaults(defineProps<Props>(), {
  title: '確認操作',
  confirmText: '確認',
  cancelText: '取消',
  dangerMode: false
})

// 定義事件
const emit = defineEmits<{
  confirm: []    // 用戶點擊確認
  cancel: []     // 用戶點擊取消或點擊背景
}>()

// 處理確認事件
const confirm = () => {
  emit('confirm')
}

// 處理取消事件
const cancel = () => {
  emit('cancel')
}

// 鍵盤事件處理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    cancel()
  } else if (event.key === 'Enter') {
    confirm()
  }
}

// 監聽鍵盤事件
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>