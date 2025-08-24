<!--
  統一看板組件 - 條件式 drag handler 架構
  
  📱🖥️ ChatGPT 建議的架構設計：
  
  ✅ 單一 BoardComponent - 控制 desktop/mobile drag handler  
     - Desktop: vue-draggable-next
     - Mobile: @vueuse/gesture  
     
  ✅ 共用 Card/List 組件 - 純渲染和樣式
     - props: cardData, listData, dragging
     - events: @dragStart, @dragEnd
     
  ✅ 條件式邏輯分離
     - 螢幕尺寸偵測決定使用哪種 drag handler
     - UI 元件不需要重複，只有事件綁定不同
-->

<template>
  <!-- 統一看板容器 - 條件式 drag handler -->
  <div 
    ref="boardContainerRef"
    :class="[
      'gap-4 p-4 h-[85vh] bg-gray-100 font-sans',
      isMobile ? 'block overflow-y-auto mobile-container' : 'flex overflow-x-auto desktop-container'
    ]"
  >
    <div v-if="isMobile">
      <MobileBoard />
    </div>
    <div v-else>
      <DesktopBoard />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useBoardView } from '@/composables/useBoardView'
import MobileBoard from '@/components/MobileBoard.vue'
import DesktopBoard from '@/components/DesktopBoard.vue'

// 🎯 統一架構：條件式載入
const { loadBoard } = useBoardView()

// 📱🖥️ 響應式螢幕尺寸偵測
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)

// 🎯 螢幕尺寸變化監聽
const handleResize = () => {
  screenWidth.value = window.innerWidth
}

console.log(`🎯 [UNIFIED-BOARD] 統一看板載入，當前模式: ${isMobile.value ? '📱 Mobile' : '🖥️ Desktop'}`)

// 🎯 模態框由子組件管理

// 🎯 組件初始化：根據螢幕尺寸設定對應功能
onMounted(async () => {
  // 監聽螢幕尺寸變化
  window.addEventListener('resize', handleResize)
  
  // 🎯 統一載入資料，避免子組件重複載入
  await loadBoard()
  
  console.log(`🎯 [UNIFIED-BOARD] 組件初始化完成，模式: ${isMobile.value ? '📱 Mobile' : '🖥️ Desktop'}`)
})

// 📱 手勢初始化已移除，由各別組件負責

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
</style>
