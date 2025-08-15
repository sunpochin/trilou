<template>
  <!-- 卡片組件 -->
  <div 
    class="bg-white rounded px-3 py-3 mb-2 shadow-sm cursor-pointer transition-shadow duration-200 hover:shadow-md"
    @click="openCardModal"
  >
    <!-- 卡片標題 -->
    <div class="min-h-6">
      {{ card.title }}
    </div>
    
    <!-- 如果有內容，顯示部分預覽 -->
    <div 
      v-show="card.content" 
      class="text-sm text-gray-600 mt-2 line-clamp-2"
    >
      {{ card.content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/boardStore'

// 定義卡片資料型別
interface Card {
  id: string
  title: string
  content?: string
}

// 接收父組件傳入的卡片資料
const props = defineProps<{
  card: Card
}>()

// 取得 store 實例
const boardStore = useBoardStore()

// 打開卡片模態框
const openCardModal = () => {
  boardStore.openCardModal(props.card.id)
}
</script>