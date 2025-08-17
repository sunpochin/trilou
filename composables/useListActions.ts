/**
 * 列表操作相關的業務邏輯 Composable
 * 
 * 🎯 SOLID 原則設計說明：
 * 
 * ✅ S (Single Responsibility) - 單一職責原則
 *    只負責列表相關的操作邏輯，不處理 UI 或其他業務
 * 
 * ✅ O (Open/Closed) - 開放封閉原則  
 *    想要新增功能（如複製列表、歸檔列表）只要在這裡加新函數
 *    不需要修改現有的 addCard、deleteList 函數
 * 
 * ✅ D (Dependency Inversion) - 依賴反轉原則
 *    組件不直接依賴 boardStore，而是透過這個抽象層
 *    未來要換資料來源（如 localStorage）只需要改這個檔案
 * 
 * 📝 擴展範例：
 *    - 新增 copyList() 函數 → 各組件自動可用，無需修改現有程式碼
 *    - 改用 localStorage → 只需修改此檔案的實作，組件完全不用動
 */
import { useBoardStore } from '@/stores/boardStore'

export const useListActions = () => {
  const boardStore = useBoardStore()

  // 新增卡片功能
  const addCard = (listId: string) => {
    const cardTitle = prompt('請輸入卡片標題：')
    if (cardTitle && cardTitle.trim()) {
      boardStore.addCard(listId, cardTitle.trim())
    }
  }

  // 刪除列表功能
  const deleteList = (listId: string) => {
    if (confirm('確定要刪除這個列表嗎？此操作無法撤銷。')) {
      boardStore.removeList(listId)
    }
  }

  // 新增列表功能
  const addList = () => {
    const listTitle = prompt('請輸入列表標題：')
    if (listTitle && listTitle.trim()) {
      boardStore.addList(listTitle.trim())
    }
  }

  return {
    addCard,
    deleteList,
    addList
  }
}