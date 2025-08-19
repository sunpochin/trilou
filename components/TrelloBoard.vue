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
    <div v-if="boardStore.isLoading" class="flex items-center justify-center w-full h-full">
      <div class="text-center">
        <SkeletonLoader 
          size="lg" 
          :text="'載入看板資料中'"
          color="#3B82F6"
          :animate="true"
        />
        <p class="mt-4 text-gray-600 text-sm">正在從雲端獲取您的看板...</p>
      </div>
    </div>

    <!-- 載入完成：顯示實際看板內容 -->
    <template v-else>
      <!-- 可拖拉的列表容器 -->
      <draggable 
        class="flex gap-4" 
        :list="boardStore.board.lists" 
        @change="onListMove"
        tag="div"
      >
        <ListItem
          v-for="list in boardStore.board.lists" 
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
          + 新增其他列表
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
import { useBoardStore } from '@/stores/boardStore'
import { useListActions } from '@/composables/useListActions'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import type { CardUI } from '@/types'

// 使用統一的卡片型別定義
type Card = CardUI

// 取得看板 store 實例
const boardStore = useBoardStore()

// 使用列表操作邏輯
const { addList } = useListActions()

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 處理卡片拖拉移動事件
const onCardMove = async (event: any) => {
  console.log('📦 [COMPONENT] Card moved event:', event)
  
  // 處理卡片被新增到列表的情況（從其他列表移動過來）
  if (event.added) {
    console.log('🔄 [COMPONENT] 卡片被新增到列表:', event.added)
    const { element: card, newIndex } = event.added
    
    // 透過事件傳遞的 event.target 或透過 DOM 查找獲取目標列表 ID
    let targetListId = null
    
    // 方法1: 透過事件目標元素查找
    if (event.to) {
      const listContainer = event.to.closest('[data-list-id]')
      if (listContainer) {
        targetListId = listContainer.getAttribute('data-list-id')
      }
    }
    
    // 方法2: 如果方法1失敗，嘗試透過組件狀態查找
    if (!targetListId) {
      // 查找卡片現在在哪個列表中
      for (const list of boardStore.board.lists) {
        const foundCard = list.cards.find(c => c.id === card.id)
        if (foundCard) {
          targetListId = list.id
          break
        }
      }
    }
    
    if (targetListId && card.id) {
      try {
        // 調用 API 更新卡片的列表和位置
        await $fetch(`/api/cards/${card.id}`, {
          method: 'PUT',
          body: {
            list_id: targetListId,
            position: newIndex
          }
        })
        console.log('✅ [COMPONENT] 成功更新卡片列表和位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 更新卡片失敗:', error)
        // 可選：重新載入資料以確保一致性
        // await boardStore.fetchBoard()
      }
    }
  }
  
  // 處理卡片在同一列表內移動的情況
  if (event.moved) {
    console.log('🔄 [COMPONENT] 卡片在列表內移動:', event.moved)
    const { element: card, newIndex } = event.moved
    
    if (card.id) {
      try {
        // 只更新位置，不改變列表
        await $fetch(`/api/cards/${card.id}`, {
          method: 'PUT',
          body: {
            position: newIndex
          }
        })
        console.log('✅ [COMPONENT] 成功更新卡片位置')
      } catch (error) {
        console.error('❌ [COMPONENT] 更新卡片位置失敗:', error)
        // 可選：重新載入資料以確保一致性
        // await boardStore.fetchBoard()
      }
    }
  }
  
  // 處理卡片從列表移除的情況（記錄用）
  if (event.removed) {
    console.log('📤 [COMPONENT] 卡片從列表被移除:', event.removed)
  }
}

// 處理列表拖拉移動事件
const onListMove = (event: any) => {
  // 使用 :list 時會自動同步，無需額外處理
  console.log('List moved:', event)
}

// 在組件載入時記錄 lists 的數量
console.log('🖼️ [COMPONENT] TrelloBoard 載入，目前 lists 數量:', boardStore.board.lists.length)
console.log('🖼️ [COMPONENT] TrelloBoard lists 內容:', boardStore.board.lists)

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
