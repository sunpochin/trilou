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
        />
      </div>

      <!-- 按鈕區域 -->
      <div class="flex gap-3 mb-6">
        <button
          @click="generateCards"
          :disabled="!userInput.trim()"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          🚀 開始生成任務
        </button>
        <button
          @click="closeModal"
          class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
        >
          取消
        </button>
      </div>

      <!-- 樂觀 UI 說明 -->
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-blue-700 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          點擊「開始生成任務」後，對話框將立即關閉，AI 將在背景生成任務並自動加入看板
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCardActions } from '@/composables/useCardActions'
import { useListActions } from '@/composables/useListActions'
import { useAiGeneration } from '@/composables/useAiGeneration'
import { eventBus } from '@/events/EventBus'

// 定義 props
interface Props {
  show: boolean
  targetListId?: string | null  // 目標列表 ID，用於指定卡片加入哪個列表
}

const props = defineProps<Props>()

// 定義 emits
const emit = defineEmits<{
  close: []
}>()

// 響應式變數
const userInput = ref('')

// 樂觀 UI 模式：移除不必要的 loading、cards、errorMessage 狀態
// 因為模態框會立即關閉，不再需要顯示這些狀態

// 取得業務邏輯 composables（遵循依賴反轉原則）
const { addCard } = useCardActions()
const { addListIfEmpty } = useListActions()
const { addPendingCards, completePendingCards, estimateCardCount } = useAiGeneration()

// 🚀 樂觀 UI：立即開始生成並加入任務到看板
async function generateCards() {
  if (!userInput.value.trim()) return
  
  const taskDescription = userInput.value.trim()
  console.log('🤖 [AI-MODAL] 樂觀 UI：立即開始任務生成流程')
  
  // 🎯 步驟1：立即關閉模態框（樂觀 UI）
  closeModal()
  
  // 🎯 步驟2：預估會生成的卡片數量並增加計數器（樂觀預估）
  const estimatedCardCount = estimateCardCount(taskDescription)
  addPendingCards(estimatedCardCount)
  console.log(`🤖 [AI-MODAL] 預估會生成 ${estimatedCardCount} 張卡片，已加入計數器`)

  // 🎯 步驟3：開始背景任務生成
  try {
    console.log('📤 [AI-MODAL] 背景呼叫 MCP API...')
    const res = await fetch('/api/mcp/expand-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: taskDescription })
    })
    
    if (!res.ok) {
      throw new Error(`伺服器錯誤: ${res.status}`)
    }
    
    const data = await res.json()
    const cards = data.cards || []
    
    if (cards.length === 0) {
      throw new Error('沒有生成任何任務，請嘗試更詳細的描述')
    }
    
    console.log(`✅ [AI-MODAL] 成功生成 ${cards.length} 個任務`, cards)
    
    // 🎯 步驟4：按優先級排序卡片 (urgent > high > medium > low > 其他)
    const priorityOrder = ['urgent', 'high', 'medium', 'low']
    const sortedCards = [...cards].sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.status) === -1 ? 999 : priorityOrder.indexOf(a.status)
      const bPriority = priorityOrder.indexOf(b.status) === -1 ? 999 : priorityOrder.indexOf(b.status)
      return aPriority - bPriority
    })
    
    console.log(`🎯 [AI-MODAL] 卡片已按優先級排序:`, sortedCards.map(c => `${c.title} (${c.status})`))
    
    // 🎯 步驟5：調整計數器以反映實際生成的卡片數量
    const actualCardCount = sortedCards.length
    const countDifference = estimatedCardCount - actualCardCount
    if (countDifference !== 0) {
      if (countDifference > 0) {
        // 實際生成的比預估的少，需要減少計數
        completePendingCards(countDifference)
        console.log(`📊 [AI-MODAL] 實際生成 ${actualCardCount} 張卡片，比預估少 ${countDifference} 張，已調整計數器`)
      } else {
        // 實際生成的比預估的多，需要增加計數
        addPendingCards(-countDifference)
        console.log(`📊 [AI-MODAL] 實際生成 ${actualCardCount} 張卡片，比預估多 ${-countDifference} 張，已調整計數器`)
      }
    }
    
    // 🎯 步驟6：自動加入到看板
    await addGeneratedCardsToBoard(sortedCards, actualCardCount)
    
  } catch (err: unknown) {
    console.error('❌ [AI-MODAL] 任務生成失敗:', err)
    
    // 🔄 任務生成失敗時，重置計數器
    completePendingCards(estimatedCardCount)
    console.log(`🔄 [AI-MODAL] 任務生成失敗，已重置計數器 (減少 ${estimatedCardCount} 張)`)
    
    // 🛡️ 類型守衛：安全地提取錯誤訊息
    const errorMessage = err instanceof Error ? err.message : String(err)
    
    // 🚀 使用 EventBus 發送通知事件（符合 Observer Pattern）
    // 避免阻塞式的 alert，提供更好的用戶體驗
    eventBus.emit('notification:error', {
      title: '任務生成失敗',
      message: errorMessage,
      duration: 5000
    })
    
    console.log('📢 [AI-MODAL] 已發送錯誤通知事件到 EventBus')
  }
}

// 將生成的卡片自動加入看板（使用依賴反轉原則）
async function addGeneratedCardsToBoard(cards: Array<{title: string, description?: string, status?: string}>, totalCards: number) {
  try {
    console.log('📋 [AI-MODAL] 開始將任務加入看板...')
    
    // 🎯 決定目標列表 ID
    let finalTargetListId: string
    
    if (props.targetListId) {
      // 如果指定了目標列表，使用指定的列表
      finalTargetListId = props.targetListId
      console.log('🎯 [AI-MODAL] 使用指定的列表:', finalTargetListId)
    } else {
      // 如果沒有指定，使用預設行為（建立新列表）
      const { id: newListId } = await addListIfEmpty('AI 生成任務')
      finalTargetListId = newListId
      console.log('🎯 [AI-MODAL] 建立新的預設列表:', finalTargetListId)
    }
    
    // 逐一加入卡片，每加入一張就減少計數器
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      try {
        await addCard(finalTargetListId, card.title, card.status || 'todo', card.description)
        // 每個卡片成功加入後，減少計數器
        completePendingCards(1)
        console.log(`✅ [AI-MODAL] 成功加入卡片 ${i + 1}/${cards.length}: ${card.title}`)
      } catch (cardError) {
        console.error(`❌ [AI-MODAL] 加入卡片失敗: ${card.title}`, cardError)
        // 即使卡片加入失敗，也要減少計數器以保持一致性
        completePendingCards(1)
      }
    }
    
    console.log(`🎉 [AI-MODAL] 完成加入 ${cards.length} 個任務到看板的流程`)
    
  } catch (error: unknown) {
    console.error('❌ [AI-MODAL] 加入任務到看板失敗:', error)
    
    // 🛡️ 類型守衛：安全地提取錯誤訊息
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // 🚀 使用 EventBus 發送通知事件（符合 Observer Pattern）
    eventBus.emit('notification:error', {
      title: '任務加入看板失敗',
      message: `任務已生成，但加入看板時發生錯誤：${errorMessage}`,
      duration: 6000
    })
    
    console.log('📢 [AI-MODAL] 已發送加入看板失敗通知事件')
  }
}

// 移除原來的 addCardsToBoard 函數，因為樂觀 UI 會自動處理

// 關閉模態框
function closeModal() {
  emit('close')
  
  // 重置狀態（延遲執行，讓動畫完成）
  setTimeout(() => {
    userInput.value = ''
  }, 300)
}

</script>