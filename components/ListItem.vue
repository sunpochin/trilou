<!--
  單個列表組件 - 負責渲染單一列表和其卡片
  
  🎯 SOLID 原則設計說明：
  
  ✅ S (Single Responsibility) - 單一職責原則
     只負責「單個列表」的渲染和基本互動，不處理整體看板邏輯
     
  ✅ O (Open/Closed) - 開放封閉原則
     要新增列表功能時，透過 emit 事件和 useListActions 擴展
     不需要修改此組件的核心邏輯
     
  ✅ D (Dependency Inversion) - 依賴反轉原則  
     不直接依賴 boardStore，而是透過 useListActions 抽象層
     
  📝 擴展方式：
     - 新增列表操作：在 useListActions 加函數，此組件自動可用
     - 新增 UI 元素：在 ListMenu 組件加按鈕，此組件接收 emit 事件
-->

<template>
  <!-- 單個列表容器 -->
  <div class="bg-gray-200 rounded w-80 p-2 flex-shrink-0">
    <!-- 列表標題區域 -->
    <div class="cursor-pointer flex justify-between items-center p-2 mb-2 relative">
      <h2 class="text-base font-bold select-none ">{{ list.title }}</h2>
      
      <!-- 列表選單組件 -->
      <ListMenu 
        :list-id="list.id"
        @add-card="handleAddCard"
        @delete-list="handleDeleteList"
      />
    </div>
    
    <!-- 可拖拉的卡片容器 -->
    <draggable
      class="min-h-5"
      :list="list.cards"
      group="cards"
      tag="div"
      @change="$emit('card-move', $event)"
    >
      <div v-for="card in list.cards" :key="card.id">
        <Card :card="card" @open-modal="$emit('open-card-modal', card)" />
      </div>
    </draggable>
    
    <!-- 新增卡片按鈕 -->
    <button 
      class="w-full p-3 bg-transparent border-2 border-dashed border-gray-300 rounded text-gray-600 cursor-pointer text-sm mt-2 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800" 
      @click="handleAddCard"
    >
      + 新增
    </button>
  </div>
</template>

<script setup lang="ts">
import Card from '@/components/Card.vue'
import ListMenu from '@/components/ListMenu.vue'
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useListActions } from '@/composables/useListActions'

// 列表資料型別定義
interface List {
  id: string
  title: string
  cards: Array<{
    id: string
    title: string
    description?: string
  }>
}

// 組件 props
const props = defineProps<{
  list: List
}>()

// 組件 emit 事件
defineEmits<{
  'card-move': [event: any]
  'open-card-modal': [card: any]
}>()

// 使用列表操作邏輯
const { addCard, deleteList } = useListActions()

// 處理新增卡片
const handleAddCard = () => {
  addCard(props.list.id)
}

// 處理刪除列表
const handleDeleteList = () => {
  deleteList(props.list.id)
}
</script>