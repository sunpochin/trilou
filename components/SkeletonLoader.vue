<template>
  <!-- 載入 Spinner 組件 -->
  <div 
    class="loading-spinner" 
    :class="{ [`size-${size}`]: true }"
    role="status"
    :aria-label="text || '載入中'"
    tabindex="0"
  >
    <div class="spinner-ring"></div>
    <div v-if="text !== undefined && text !== null" class="loading-text">
      {{ displayText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

/**
 * LoadingSpinner 組件
 * 
 * 🎯 功能：
 * - 顯示旋轉的載入動畫
 * - 支援不同尺寸
 * - 支援打字效果的文字動畫
 * - 可自訂顏色和樣式
 */

interface Props {
  size?: 'sm' | 'md' | 'lg' // 尺寸選項
  text?: string             // 顯示的文字
  color?: string           // 主色調
  animate?: boolean        // 是否啟用打字效果
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: '#3B82F6',
  animate: true
})

// 打字效果的響應式文字
const displayText = ref('')
const currentIndex = ref(0)
const isTyping = ref(true)

// 儲存定時器引用以便清理
let typeInterval: NodeJS.Timeout | null = null

// 打字動畫邏輯
const typeWriter = () => {
  if (!props.text || !props.animate) {
    displayText.value = props.text || ''
    return
  }

  // 清理之前的定時器
  if (typeInterval) {
    clearInterval(typeInterval)
  }

  const fullText = props.text
  
  typeInterval = setInterval(() => {
    if (isTyping.value) {
      // 正在打字
      if (currentIndex.value < fullText.length) {
        displayText.value = fullText.substring(0, currentIndex.value + 1)
        currentIndex.value++
      } else {
        // 打字完成，等待一下然後開始刪除
        setTimeout(() => {
          isTyping.value = false
        }, 1500)
      }
    } else {
      // 正在刪除
      if (currentIndex.value > 0) {
        currentIndex.value--
        displayText.value = fullText.substring(0, currentIndex.value)
      } else {
        // 刪除完成，重新開始打字
        isTyping.value = true
      }
    }
  }, isTyping.value ? 150 : 100) // 打字速度比刪除速度慢
}

// 當文字改變時重新啟動動畫
watch(() => props.text, () => {
  if (!props.animate) {
    displayText.value = props.text || ''
    return
  }
  currentIndex.value = 0
  isTyping.value = true
  displayText.value = ''
  // 只在客戶端執行打字動畫
  if (import.meta.client) {
    typeWriter()
  }
}, { immediate: true })

onMounted(() => {
  // 確保只在客戶端執行
  typeWriter()
})

// 組件卸載時清理定時器
onUnmounted(() => {
  if (typeInterval) {
    clearInterval(typeInterval)
    typeInterval = null
  }
})
</script>

<style scoped>
/* 載入 Spinner 樣式 */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Spinner 環形動畫 */
.spinner-ring {
  position: relative;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top: 3px solid v-bind(color);
  animation: spin 1s linear infinite;
}

/* 不同尺寸 */
.size-sm .spinner-ring {
  width: 20px;
  height: 20px;
}

.size-md .spinner-ring {
  width: 32px;
  height: 32px;
}

.size-lg .spinner-ring {
  width: 48px;
  height: 48px;
}

/* 載入文字樣式 */
.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  min-height: 1.25rem; /* 避免文字變化時高度跳動 */
  display: flex;
  align-items: center;
}

/* 添加打字光標效果 */
.loading-text::after {
  content: '|';
  animation: blink 1s infinite;
  margin-left: 2px;
  color: v-bind(color);
}

/* 旋轉動畫 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 光標閃爍動畫 */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 加強視覺效果的漸變背景 */
.spinner-ring::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    v-bind(color) 90deg,
    transparent 180deg,
    transparent 360deg
  );
  mask: radial-gradient(circle, transparent 50%, black 50%);
  -webkit-mask: radial-gradient(circle, transparent 50%, black 50%);
  animation: spin 2s linear infinite reverse;
  opacity: 0.3;
}
</style>