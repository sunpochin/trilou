<!--
  AI 任務生成模態框組件
  
  功能：
  - 讓使用者輸入任務描述
  - 調用本地 MCP 伺服器生成任務卡片
  - 顯示生成進度和結果
  - 支援將生成的卡片加入看板
-->

<template>
  <!-- 模態框遮罩 -->
  <div 
    v-if="show" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeModal"
  >
    <!-- 模態框內容 -->
    <div 
      class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- 標題列 -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">AI 生成任務</h2>
        <button 
          @click="closeModal"
          class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- 輸入區域 -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          描述您需要的任務：
        </label>
        <textarea
          v-model="userInput"
          placeholder="例如：我需要準備一個產品發表會，包含所有相關的準備工作..."
          class="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          :disabled="loading"
        />
      </div>

      <!-- 按鈕區域 -->
      <div class="flex gap-3 mb-6">
        <button
          @click="generateCards"
          :disabled="!userInput.trim() || loading"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            生成中...
          </span>
          <span v-else>生成任務</span>
        </button>
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
        >
          取消
        </button>
      </div>

      <!-- 生成結果區域 -->
      <div v-if="cards.length > 0" class="border-t pt-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-3">生成的任務 ({{ cards.length }} 項)：</h3>
        
        <div class="space-y-3 max-h-60 overflow-y-auto">
          <div 
            v-for="(card, index) in cards" 
            :key="index"
            class="p-3 bg-gray-50 rounded-lg border"
          >
            <div class="flex justify-between items-start">
              <h4 class="font-medium text-gray-800 flex-1">{{ card.title }}</h4>
              <span 
                v-if="card.status" 
                class="ml-2 px-2 py-1 text-xs rounded-sm font-medium"
                :class="getStatusTagClass(card.status)"
              >
                {{ formatStatus(card.status) }}
              </span>
            </div>
            <p v-if="card.description" class="text-sm text-gray-600 mt-1">{{ card.description }}</p>
          </div>
        </div>

        <!-- 新增到看板按鈕 -->
        <div class="mt-4 pt-4 border-t">
          <button
            @click="addCardsToBoard"
            class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            將這些任務加入看板
          </button>
        </div>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBoardStore } from '@/stores/boardStore'
import { useListActions } from '@/composables/useListActions'
import { useCardActions } from '@/composables/useCardActions'
import { formatStatus, getStatusTagClass, normalizeStatusForStorage } from '@/utils/statusFormatter'

// 定義 props
interface Props {
  show: boolean
}

defineProps<Props>()

// 定義 emits
const emit = defineEmits<{
  close: []
}>()

// 響應式變數
const userInput = ref('')
const cards = ref<Array<{title: string, description?: string, status?: string}>>([])
const loading = ref(false)
const errorMessage = ref('')

// 透過外觀/動作層與 Store 互動（依賴反轉）
const boardStore = useBoardStore() // 需要存取列表狀態
const { addListDirect } = useListActions()
const { addCard } = useCardActions()

// 生成卡片的函數
async function generateCards() {
  if (!userInput.value.trim()) return
  
  loading.value = true
  cards.value = []
  errorMessage.value = ''

  try {
    const res = await fetch('/api/mcp/expand-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: userInput.value })
    })
    
    if (!res.ok) {
      throw new Error(`伺服器錯誤: ${res.status}`)
    }
    
    const data = await res.json()
    cards.value = data.cards || []
    
    if (cards.value.length === 0) {
      errorMessage.value = '沒有生成任何任務，請嘗試更詳細的描述'
    }
  } catch (err) {
    console.error('生成任務時發生錯誤:', err)
    errorMessage.value = '無法連接到 AI 服務，請確認本地伺服器是否運行中'
  } finally {
    loading.value = false
  }
}

// 將卡片加入看板
async function addCardsToBoard(): Promise<void> {
  if (cards.value.length === 0) return
  
  try {
    // 找到第一個列表，如果沒有列表就創建一個
    // 由動作層提供取得/建立預設列表的能力（若無則建立）
    let targetList = boardStore.board.lists[0]
    
    if (!targetList) {
      // 創建一個新列表
      await addListDirect('AI 生成任務')
      targetList = boardStore.board.lists[0]
    }
    
    // 將每個生成的卡片加入到列表中
    for (const card of cards.value) {
      // 正規化狀態以確保資料庫一致性
      const normalized = normalizeStatusForStorage(card.status ?? 'todo')
      await addCard(targetList.id, card.title, normalized)
    }
    
    // 關閉模態框並重置狀態
    closeModal()
  } catch (error) {
    console.error('加入卡片到看板時發生錯誤:', error)
    errorMessage.value = '加入看板時發生錯誤，請稍後再試'
  }
}

// 關閉模態框
function closeModal() {
  emit('close')
  
  // 重置狀態（延遲執行，讓動畫完成）
  setTimeout(() => {
    userInput.value = ''
    cards.value = []
    errorMessage.value = ''
    loading.value = false
  }, 300)
}

</script>