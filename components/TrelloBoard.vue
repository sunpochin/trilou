<!--
  主看板組件 - 負責整體看板佈局和組件協調
  
  🎯 SOLID 原則設計說明：
  
  ✅ S (Single Responsibility) - 單一職責原則
     只負責「整體看板佈局」和「組件間的事件協調」
     不處理單個列表的詳細邏輯
     
  ✅ O (Open/Closed) - 開放封閉原則
     要新增看板功能時，透過新增組件或修改子組件來擴展
     不需要修改此組件的核心佈局邏輯
     
  ✅ D (Dependency Inversion) - 依賴反轉原則
     依賴抽象的 ListItem 組件，不直接處理列表內部邏輯
     
  📝 重構前後對比：
     重構前：一個檔案 197 行，處理所有邏輯
     重構後：主檔案 95 行，職責清晰分離
-->

<template>
  <!-- 看板主容器 -->
  <div class="flex gap-4 p-4 h-screen overflow-x-auto bg-gray-100 font-sans">
    
    <!-- 載入狀態：顯示 loading spinner -->
    <div v-if="viewData.isLoading" class="flex items-center justify-center w-full h-full">
      <div class="text-center">
        <SkeletonLoader 
          size="lg" 
          :text="MESSAGES.board.loadingFromCloud"
          color="#3B82F6"
          :animate="true"
        />
      </div>
    </div>

    <!-- 載入完成：顯示實際看板內容 -->
    <template v-else>
      <!-- 可拖拉的列表容器 -->
      <draggable 
        class="flex gap-4" 
        :list="viewData.lists" 
        @change="onListMove"
        tag="div"
      >
        <ListItem
          v-for="list in viewData.lists" 
          :key="list.id"
          :list="list"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
        />
      </draggable>

      <!-- 新增列表按鈕 -->
      <div class="bg-gray-200 rounded w-80 p-2 flex-shrink-0 flex items-start">
        <button 
          class="w-full p-3 bg-transparent border-2 border-dashed border-gray-400 rounded text-gray-700 cursor-pointer text-sm transition-all duration-200 hover:bg-gray-300 hover:border-gray-500" 
          @click="handleAddList"
        >
          + {{ MESSAGES.list.addNew }}
        </button>
      </div>
    </template>

    <!-- 卡片編輯模態框 -->
    <CardModal 
      :show="showCardModal" 
      :card="selectedCard" 
      @close="closeCardModal" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ListItem from '@/components/ListItem.vue'
import CardModal from '@/components/CardModal.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useListActions } from '@/composables/useListActions'
import { useBoardView } from '@/composables/useBoardView'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import type { CardUI } from '@/types'
import { MESSAGES } from '@/constants/messages'

// 使用統一的卡片型別定義
type Card = CardUI

// 🎯 使用 Rabbit 建議的依賴反轉：不直接依賴 boardStore
// 改為依賴抽象的 composables 接口
const { addList } = useListActions()
const { viewData, handleCardMove, handleListMove, findListById, getAllListIds } = useBoardView()

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 處理卡片拖拉移動事件
const onCardMove = async (event: any) => {
  console.log('📦 [COMPONENT] Card moved event:', event)
  
  // 處理卡片被新增到列表的情況（從其他列表移動過來）
  if (event.added) {
    console.log('🔄 [COMPONENT] 卡片被新增到列表:', event.added)
    // 🎯 跨列表移動會觸發兩個事件：removed + added
    // 我們需要等 removed 事件處理完成，才處理 added
    // 但這裡可以先記錄，實際的 moveCard 邏輯交給 removed 事件處理
    console.log('📝 [COMPONENT] 跨列表移動的 added 事件，由 removed 事件統一處理')
  }
  
  // 處理卡片在同一列表內移動的情況
  if (event.moved) {
    console.log('🔄 [COMPONENT] 卡片在列表內移動:', event.moved)
    const { element: card } = event.moved
    
    // 🎯 找到卡片所在的列表（使用抽象方法）
    let currentListId = null
    for (const list of viewData.lists) {
      const foundCard = list.cards.find(c => c.id === card.id)
      if (foundCard) {
        currentListId = list.id
        break
      }
    }
    
    if (currentListId) {
      try {
        console.log(`🚀 [COMPONENT] 同一列表內移動，重新整理列表 ${currentListId} 的位置`)
        // ✅ Vue Draggable 已經更新了 UI，我們只需要重新排序 position
        await handleCardMove([currentListId])
        console.log('✅ [COMPONENT] 成功更新列表內卡片位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 更新卡片位置失敗:', error)
        // 可選：重新載入資料以確保一致性
        // await boardStore.fetchBoard()
      }
    }
  }
  
  // 處理卡片從列表移除的情況（跨列表移動）
  if (event.removed) {
    console.log('📤 [COMPONENT] 卡片從列表被移除（跨列表移動）:', event.removed)
    const { element: card } = event.removed
    
    // 🎯 找到卡片現在在哪個列表中（Vue Draggable 已經移動了）
    let targetListId = null
    for (const list of viewData.lists) {
      const foundCard = list.cards.find(c => c.id === card.id)
      if (foundCard) {
        targetListId = list.id
        break
      }
    }
    
    // 🔧 改良版：多重方式嘗試找到原來的列表 ID
    let sourceListId = null
    
    // 方法 1：嘗試從 DOM 元素獲取
    if (event.from) {
      const sourceContainer = event.from.closest('[data-list-id]')
      if (sourceContainer) {
        sourceListId = sourceContainer.getAttribute('data-list-id')
        console.log('✅ [COMPONENT] 方法1成功獲取 sourceListId:', sourceListId)
      }
    }
    
    // 方法 2：如果方法1失敗，使用排除法推算
    if (!sourceListId && targetListId) {
      console.log('⚠️ [COMPONENT] 方法1失敗，嘗試方法2：排除法推算 sourceListId')
      // 假設只有兩個列表發生變化，找出不是 targetListId 的那個
      for (const list of viewData.lists) {
        if (list.id !== targetListId) {
          // 檢查這個列表是否有位置變化（表示有卡片被移出）
          const hasGaps = list.cards.some((c, index) => c.position !== undefined && c.position !== index)
          if (hasGaps) {
            sourceListId = list.id
            console.log('✅ [COMPONENT] 方法2推算出 sourceListId:', sourceListId)
            break
          }
        }
      }
    }
    
    // 方法 3：如果前兩種方法都失敗，重新整理所有列表
    if (!sourceListId && targetListId) {
      console.log('⚠️ [COMPONENT] 方法1和2都失敗，使用方法3：重新整理所有列表')
      try {
        const allListIds = getAllListIds()
        await handleCardMove(allListIds)
        console.log('✅ [COMPONENT] 方法3：成功重新整理所有列表位置')
        return // 早期返回，避免重複執行
      } catch (error) {
        console.error('❌ [COMPONENT] 方法3失敗:', error)
      }
    }
    
    // 🎯 執行跨列表移動邏輯
    if (targetListId) {
      // 只要能識別到 targetListId，就執行更新
      const listsToUpdate = sourceListId ? [sourceListId, targetListId] : [targetListId]
      
      try {
        console.log(`🚀 [COMPONENT] 跨列表移動：${sourceListId || '未知'} → ${targetListId}`)
        console.log(`📋 [COMPONENT] 需要更新的列表:`, listsToUpdate)
        
        await handleCardMove(listsToUpdate)
        console.log('✅ [COMPONENT] 成功完成跨列表移動並重新整理位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 跨列表移動失敗:', error)
        // 🔄 最後的恢復策略：重新載入資料確保一致性
        console.log('🔄 [COMPONENT] 嘗試重新載入看板資料...')
        // 可以選擇是否重新載入（可能會影響用戶體驗）
        // await boardStore.fetchBoard()
      }
    } else {
      console.warn('⚠️ [COMPONENT] 無法識別 targetListId，跳過跨列表移動處理')
      console.log('📊 [COMPONENT] 當前看板狀態:', {
        listsCount: viewData.listsCount,
        cardId: card.id,
        cardTitle: card.title
      })
    }
  }
}

// 處理列表拖拉移動事件
const onListMove = async (event: any) => {
  console.log('📋 [COMPONENT] List moved event:', event)
  
  // 🎯 Vue Draggable 的 :list 屬性會自動修改 viewData.lists 陣列順序
  // 這就是為什麼 UI 立即更新的原因！
  
  // 但是我們需要將新的順序保存到資料庫
  if (event.moved) {
    console.log('🔄 [COMPONENT] 列表在看板內移動:', event.moved)
    
    try {
      // 🎯 委派給 Store 處理：符合 SRP (單一職責原則)
      // 組件只負責佈局協調，資料儲存由 Store 負責
      console.log('💾 [COMPONENT] 委派保存列表順序到 Store...')
      await handleListMove()
      console.log('✅ [COMPONENT] 列表位置已更新')
      
    } catch (error) {
      console.error('❌ [COMPONENT] 更新列表順序失敗:', error)
      // 可選：重新載入資料以確保一致性
      // await boardStore.fetchBoard()
    }
  }
}

// 在組件載入時記錄 lists 的數量
console.log('🖼️ [COMPONENT] TrelloBoard 載入，目前 lists 數量:', viewData.listsCount)
console.log('🖼️ [COMPONENT] TrelloBoard 使用依賴反轉原則，透過 composable 訪問資料')

// 處理新增列表
const handleAddList = () => {
  addList()
}

// 開啟卡片模態框
const openCardModal = (card: Card) => {
  selectedCard.value = card
  showCardModal.value = true
}

// 關閉卡片模態框
const closeCardModal = () => {
  showCardModal.value = false
  selectedCard.value = null
}
</script>
