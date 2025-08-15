<template>
  <div class="card">
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

<style scoped>
.card {
  background-color: white;
  border-radius: 3px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 0 #091e4240;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 1px 3px #091e4240;
}
</style>