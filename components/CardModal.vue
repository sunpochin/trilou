<template>
  <!-- 模態框背景遮罩 -->
  <Teleport to="body">
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <!-- 模態框內容 -->
      <div 
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"
        @click.stop
      >
        <!-- 模態框標頭 -->
        <div class="flex items-center justify-between p-6 border-b">
          <div class="flex items-center gap-3">
            <!-- 卡片圖示 -->
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <!-- 卡片標題編輯區域 -->
            <div class="flex-1">
              <textarea
                ref="titleInput"
                v-model="editingTitle"
                class="w-full text-xl font-semibold text-gray-800 bg-transparent border-none resize-none outline-none focus:bg-white focus:shadow-sm focus:border focus:border-blue-300 rounded px-2 py-1"
                rows="1"
                placeholder="輸入卡片標題..."
                @input="autoResize"
                @keydown.enter.exact.prevent="saveTitleAndFocusContent"
                @blur="saveTitle"
              />
            </div>
          </div>
          <!-- 關閉按鈕 -->
          <button 
            @click="closeModal"
            class="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 模態框主要內容 -->
        <div class="p-6">
          <!-- 描述區域 -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-3">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
              <h3 class="text-lg font-semibold text-gray-800">描述</h3>
            </div>
            <textarea
              ref="contentInput"
              v-model="editingContent"
              class="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none outline-none focus:border-blue-300 focus:shadow-sm text-gray-700"
              placeholder="為這張卡片新增更詳細的描述..."
              @input="autoResizeContent"
              @blur="saveContent"
            />
          </div>

          <!-- 操作按鈕區域 -->
          <div class="flex gap-3">
            <button 
              @click="saveAndClose"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              儲存
            </button>
            <button 
              @click="closeModal"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

// 事件定義
const emit = defineEmits(['close'])

// 取得 store 實例
const boardStore = useBoardStore()

// 編輯狀態
const editingTitle = ref('')
const editingContent = ref('')

// DOM 引用
const titleInput = ref<HTMLTextAreaElement | null>(null)
const contentInput = ref<HTMLTextAreaElement | null>(null)

// 初始化編輯內容
const initializeContent = () => {
  const selectedCard = boardStore.selectedCard
  if (selectedCard) {
    editingTitle.value = selectedCard.title
    editingContent.value = selectedCard.content || ''
  }
}

// 自動調整標題輸入框高度
const autoResize = () => {
  if (titleInput.value) {
    titleInput.value.style.height = 'auto'
    titleInput.value.style.height = titleInput.value.scrollHeight + 'px'
  }
}

// 自動調整內容輸入框高度
const autoResizeContent = () => {
  if (contentInput.value) {
    contentInput.value.style.height = 'auto'
    contentInput.value.style.height = Math.max(120, contentInput.value.scrollHeight) + 'px'
  }
}

// 儲存標題
const saveTitle = () => {
  if (boardStore.selectedCardId && editingTitle.value.trim()) {
    boardStore.updateCard(boardStore.selectedCardId, {
      title: editingTitle.value.trim()
    })
  }
}

// 儲存內容
const saveContent = () => {
  if (boardStore.selectedCardId) {
    boardStore.updateCard(boardStore.selectedCardId, {
      content: editingContent.value
    })
  }
}

// 儲存標題並聚焦到內容輸入框
const saveTitleAndFocusContent = () => {
  saveTitle()
  nextTick(() => {
    if (contentInput.value) {
      contentInput.value.focus()
    }
  })
}

// 儲存並關閉
const saveAndClose = () => {
  saveTitle()
  saveContent()
  closeModal()
}

// 關閉模態框
const closeModal = () => {
  emit('close')
}

// 處理鍵盤事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// 組件掛載時的初始化
onMounted(() => {
  initializeContent()
  
  // 聚焦到標題輸入框
  nextTick(() => {
    if (titleInput.value) {
      titleInput.value.focus()
      titleInput.value.select()
      autoResize()
    }
    if (contentInput.value) {
      autoResizeContent()
    }
  })
  
  // 綁定鍵盤事件
  document.addEventListener('keydown', handleKeyDown)
})

// 組件卸載時清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>