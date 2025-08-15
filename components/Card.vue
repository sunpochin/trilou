<template>
  <!-- 卡片組件 -->
  <div class="bg-white rounded px-3 py-3 mb-2 shadow-sm cursor-pointer transition-shadow duration-200 hover:shadow-md">
    {{ card.title }}
  </div>
</template>

<script setup lang="ts">
// 定義卡片資料型別
interface Card {
  id: string
  title: string
}

// 接收父組件傳入的卡片資料
defineProps<{
  card: Card
}>()
</script>