<!--
  🎯 UndoToast 組件 - 復原操作通知組件

  💡 十歲小朋友解釋：
  就像你不小心刪掉了樂高作品，然後螢幕角落會出現一個小視窗說：
  「作品已經收起來了，要拿回來嗎？」還有一個「拿回來」按鈕

  📋 主要功能：
  ✅ 從右邊滑入的動畫效果
  ✅ 顯示「卡片已經封存」訊息  
  ✅ 提供「復原」按鈕
  ✅ 自動消失（可設定時間）
  ✅ 點擊復原後立即消失

  🎨 設計特色：
  - 位置：左下角固定位置
  - 動畫：從右邊滑入，消失時滑出
  - 樣式：現代化圓角卡片設計
  - 顏色：中性色調，不會太搶眼
-->

<template>
  <Transition
    name="slide-right"
    enter-active-class="transform transition-all duration-300 ease-out"
    enter-from-class="translate-x-full opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transform transition-all duration-300 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-full opacity-0"
  >
    <div
      v-if="visible"
      data-testid="undo-toast"
      class="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 max-w-sm"
    >
      <!-- 封存圖示 -->
      <svg class="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v1m0 0h4m-4 0a1 1 0 00-1 1v3a1 1 0 001 1h4a1 1 0 001-1V4a1 1 0 00-1-1m-6 0V3a1 1 0 011-1h4a1 1 0 011 1v1"/>
      </svg>

      <!-- 訊息內容 -->
      <div class="flex-1">
        <p class="text-sm font-medium">{{ message }}</p>
      </div>

      <!-- 復原按鈕 -->
      <button
        data-testid="undo-button"
        @click="handleUndo"
        class="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-gray-700 transition-colors"
      >
        復原
      </button>

      <!-- 關閉按鈕 -->
      <button
        data-testid="close-toast-button"
        @click="handleClose"
        class="text-gray-400 hover:text-white ml-1"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

// 🎯 組件 Props
interface Props {
  message?: string
  duration?: number // 自動消失時間（毫秒）
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: '卡片已經封存',
  duration: 5000 // 5秒後自動消失
})

// 🎯 組件 Emits
interface Emits {
  undo: []
  close: []
}

const emit = defineEmits<Emits>()

// 🎯 自動消失計時器
let autoCloseTimer: NodeJS.Timeout | null = null

// 處理復原按鈕點擊
const handleUndo = () => {
  console.log('🔄 [UNDO-TOAST] 用戶點擊復原按鈕')
  clearAutoCloseTimer()
  emit('undo')
  // 復原後立即關閉 toast
  emit('close')
}

// 處理關閉按鈕點擊
const handleClose = () => {
  console.log('❌ [UNDO-TOAST] 用戶點擊關閉按鈕')
  clearAutoCloseTimer()
  emit('close')
}

// 清除自動關閉計時器
const clearAutoCloseTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

// 設置自動關閉計時器
const setupAutoClose = () => {
  if (props.duration > 0) {
    autoCloseTimer = setTimeout(() => {
      console.log('⏰ [UNDO-TOAST] 自動關閉倒數結束')
      emit('close')
    }, props.duration)
  }
}

// 監聽 visible 變化，設置自動關閉
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    setupAutoClose()
  } else {
    clearAutoCloseTimer()
  }
})

// 組件銷毀時清理計時器
onUnmounted(() => {
  clearAutoCloseTimer()
})
</script>

<style scoped>
/* 動畫樣式已經在 template 中使用 Transition 定義 */
</style>