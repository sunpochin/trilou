<template>
  <!-- 看板主容器 -->
  <div class="flex gap-4 p-4 h-screen overflow-x-auto bg-gray-100 font-sans">
    <!-- 每個列表欄位 -->
    <div 
      class="bg-gray-200 rounded w-80 p-2 flex-shrink-0" 
      v-for="list in boardStore.board.lists" 
      :key="list.id"
    >
      <!-- 列表標題 -->
      <h2 class="text-base font-bold p-2 mb-2">{{ list.title }}</h2>
      
      <!-- 可拖拉的卡片容器 -->
      <VueDraggable
        v-model="list.cards"
        group="cards"
        item-key="id"
        class="min-h-5"
        tag="div"
        @end="onCardMove"
      >
        <template #item="{ element: card }">
          <div :key="card.id">
            <Card :card="card" />
          </div>
        </template>
      </VueDraggable>
      
      <!-- 新增卡片按鈕 -->
      <button 
        class="w-full p-3 bg-transparent border-2 border-dashed border-gray-300 rounded text-gray-600 cursor-pointer text-sm mt-2 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800" 
        @click="addNewCard(list.id)"
      >
        + 新增
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from '@/components/Card.vue'
import { useBoardStore } from '@/stores/boardStore'
import VueDraggable from 'vuedraggable'

// 取得看板 store 實例
const boardStore = useBoardStore()

// 處理卡片拖拉移動事件
const onCardMove = (event: any) => {
  // 拖拉完成後的處理邏輯
  console.log('Card moved:', event)
}

// 新增卡片功能
const addNewCard = (listId: string) => {
  const cardTitle = prompt('請輸入卡片標題：')
  if (cardTitle && cardTitle.trim()) {
    boardStore.addCard(listId, cardTitle.trim())
  }
}
</script>
