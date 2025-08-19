<template>
  <!-- 輸入對話框背景遮罩 -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="cancel"
  >
    <!-- 輸入對話框內容 -->
    <div 
      class="bg-white rounded-lg p-6 w-96 max-w-full mx-4 shadow-xl transform transition-all duration-200 scale-100"
      @click.stop
    >
      <!-- 圖標區域 -->
      <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full">
        <svg 
          class="w-6 h-6 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </div>

      <!-- 標題 -->
      <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">
        {{ title || '輸入資訊' }}
      </h3>

      <!-- 說明文字 -->
      <p v-if="message" class="text-sm text-gray-600 text-center mb-4">
        {{ message }}
      </p>

      <!-- 輸入框 -->
      <div class="mb-6">
        <input
          ref="inputRef"
          v-model="inputValue"
          :placeholder="placeholder"
          @keydown.enter="confirm"
          @keydown.escape="cancel"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
          type="text"
        />
      </div>

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
          :disabled="!inputValue.trim()"
          :class="[
            'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 transition-colors duration-200',
            !inputValue.trim() 
              ? 'bg-gray-400 cursor-not-allowed' 
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
// 輸入對話框組件的 Props 定義
interface Props {
  show: boolean           // 是否顯示對話框
  title?: string          // 對話框標題
  message?: string        // 說明訊息
  placeholder?: string    // 輸入框佔位符
  confirmText?: string    // 確認按鈕文字
  cancelText?: string     // 取消按鈕文字
  initialValue?: string   // 初始值
}

// 定義 Props 預設值
const props = withDefaults(defineProps<Props>(), {
  title: '輸入資訊',
  confirmText: '確認',
  cancelText: '取消',
  placeholder: '請輸入...',
  initialValue: ''
})

// 定義事件
const emit = defineEmits<{
  confirm: [value: string]    // 用戶點擊確認並傳遞輸入值
  cancel: []                  // 用戶點擊取消或點擊背景
}>()

// 響應式數據
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// 監聽 show 屬性變化，自動聚焦和設定初始值
watch(() => props.show, (newShow) => {
  if (newShow) {
    inputValue.value = props.initialValue
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        inputRef.value.select()
      }
    })
  }
})

// 處理確認事件
const confirm = () => {
  const value = inputValue.value.trim()
  if (value) {
    emit('confirm', value)
  }
}

// 處理取消事件
const cancel = () => {
  emit('cancel')
}

// 鍵盤事件處理
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.show) return
  
  if (event.key === 'Escape') {
    cancel()
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