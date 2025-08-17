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
    <!-- 可拖拉的列表容器 -->
    <VueDraggable
      v-model="boardStore.board.lists"
      group="lists"
      item-key="id"
      class="flex gap-4"
      tag="div"
      @end="onListMove"
    >
      <template #item="{ element: list }">
        <ListItem
          :key="list.id"
          :list="list"
          @card-move="onCardMove"
          @open-card-modal="openCardModal"
        />
      </template>
    </VueDraggable>

    <!-- 新增列表按鈕 -->
    <div class="bg-gray-200 rounded w-80 p-2 flex-shrink-0 flex items-start">
      <button 
        class="w-full p-3 bg-transparent border-2 border-dashed border-gray-400 rounded text-gray-700 cursor-pointer text-sm transition-all duration-200 hover:bg-gray-300 hover:border-gray-500" 
        @click="handleAddList"
      >
        + 新增其他列表
      </button>
    </div>

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
import { useBoardStore } from '@/stores/boardStore'
import { useListActions } from '@/composables/useListActions'
import VueDraggable from 'vuedraggable'

// 卡片資料型別定義
interface Card {
  id: string
  title: string
  description?: string
}

// 取得看板 store 實例
const boardStore = useBoardStore()

// 使用列表操作邏輯
const { addList } = useListActions()

// 模態框狀態管理
const showCardModal = ref(false)
const selectedCard = ref<Card | null>(null)

// 處理卡片拖拉移動事件
const onCardMove = (event: any) => {
  // 拖拉完成後的處理邏輯
  console.log('Card moved:', event)
}

// 處理列表拖拉移動事件
const onListMove = (event: any) => {
  // 列表順序已經由 v-model 自動更新，無需額外處理
  console.log('List moved:', event)
}

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
