/**
 * 🤖 useAiGeneration = AI 生成管理 Composable
 * 
 * 🎯 這個檔案負責什麼？
 * - 管理 AI 卡片生成的計數和狀態
 * - 封裝 AI 相關的業務邏輯，避免組件直接使用 store
 * - 符合依賴反轉原則：組件依賴抽象接口，不依賴具體實作
 * 
 * 💡 十歲小朋友解釋：
 * 想像你在等披薩店做披薩：
 * - incrementPendingAiCards = 點了幾個披薩，店員寫在黑板上
 * - decrementPendingAiCards = 披薩做好了，從黑板上劃掉一個
 * - resetPendingAiCards = 全部披薩都做好了，擦掉黑板
 * 
 * 🏗️ 設計模式應用：
 * - Facade Pattern: 提供簡單接口隱藏複雜的 store 操作
 * - Dependency Inversion: 組件依賴此抽象，不直接使用 boardStore
 */

import { useBoardStore } from '@/stores/boardStore'
import { computed } from 'vue'

export const useAiGeneration = () => {
  const boardStore = useBoardStore()

  // 提供只讀的計數狀態
  const pendingCount = computed(() => boardStore.pendingAiCards)
  const isGenerating = computed(() => boardStore.pendingAiCards > 0)

  // 增加待生成卡片數量
  const addPendingCards = (count: number = 1) => {
    boardStore.incrementPendingAiCards(count)
  }

  // 減少待生成卡片數量（當卡片生成完成時）
  const completePendingCards = (count: number = 1) => {
    boardStore.decrementPendingAiCards(count)
  }

  // 重置計數器
  const resetPendingCards = () => {
    boardStore.resetPendingAiCards()
  }

  // 預估卡片數量（根據任務描述複雜度）
  const estimateCardCount = (description: string): number => {
    return Math.min(8, Math.max(3, Math.floor(description.length / 20)))
  }

  return {
    // 狀態
    pendingCount,
    isGenerating,
    
    // 方法
    addPendingCards,
    completePendingCards,
    resetPendingCards,
    estimateCardCount
  }
}