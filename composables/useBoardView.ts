/**
 * 🎮 useBoardView = 看板視圖控制器
 * 
 * 🎯 符合 Rabbit 建議的依賴反轉原則：
 * - 組件不直接依賴 boardStore
 * - 透過抽象的 composable 接口訪問資料
 * - 遵循 SOLID 原則，提升可測試性
 * 
 * 📋 主要功能：
 * - 提供看板視圖所需的資料（列表、載入狀態等）
 * - 處理拖拽操作的協調邏輯
 * - 封裝複雜的 store 操作
 */

import { computed } from 'vue'
import { useBoardStore } from '@/stores/boardStore'

export const useBoardView = () => {
  const boardStore = useBoardStore()

  // 🔍 提供只讀的視圖資料（避免組件直接修改 store）
  const viewData = computed(() => ({
    lists: boardStore.board.lists,
    isLoading: boardStore.isLoading,
    listsCount: boardStore.board.lists.length,
    isEmpty: boardStore.board.lists.length === 0
  }))

  // 🎯 拖拽操作的抽象方法
  const handleCardMove = async (affectedListIds: string[]) => {
    console.log('🚀 [BOARD-VIEW] 處理卡片移動，受影響列表:', affectedListIds)
    
    if (affectedListIds.length === 0) {
      console.log('ℹ️ [BOARD-VIEW] 沒有受影響的列表，跳過更新')
      return
    }

    try {
      await boardStore.moveCardAndReorder(affectedListIds)
      console.log('✅ [BOARD-VIEW] 卡片位置更新成功')
    } catch (error) {
      console.error('❌ [BOARD-VIEW] 卡片位置更新失敗:', error)
      // 這裡可以添加錯誤通知或重新載入邏輯
      throw error
    }
  }

  // 🎯 列表拖拽操作的抽象方法
  const handleListMove = async () => {
    console.log('🚀 [BOARD-VIEW] 處理列表移動')
    
    try {
      await boardStore.saveListPositions()
      console.log('✅ [BOARD-VIEW] 列表位置更新成功')
    } catch (error) {
      console.error('❌ [BOARD-VIEW] 列表位置更新失敗:', error)
      throw error
    }
  }

  // 🎯 檢查列表是否存在的安全方法
  const findListById = (listId: string) => {
    return boardStore.board.lists.find(list => list.id === listId)
  }

  // 🎯 獲取所有列表 ID 的方法
  const getAllListIds = () => {
    return boardStore.board.lists.map(list => list.id)
  }

  // 🎯 初始化看板資料
  const loadBoard = async () => {
    console.log('📋 [BOARD-VIEW] 載入看板資料')
    
    try {
      await boardStore.fetchBoard()
      console.log('✅ [BOARD-VIEW] 看板資料載入成功')
    } catch (error) {
      console.error('❌ [BOARD-VIEW] 看板資料載入失敗:', error)
      throw error
    }
  }

  return {
    // 只讀資料
    viewData,
    
    // 操作方法
    handleCardMove,
    handleListMove,
    loadBoard,
    
    // 查詢方法
    findListById,
    getAllListIds
  }
}