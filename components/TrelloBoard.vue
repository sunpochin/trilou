<template>
  <div class="trello-board">
    <div class="column" v-for="list in boardStore.board.lists" :key="list.id">
      <h2 class="column-title">{{ list.title }}</h2>
      <Card v-for="card in list.cards" :key="card.id" :card="card" />
    </div>
  </div>
</template>

<script setup>
import Card from '@/components/Card.vue'
import { useBoardStore } from '@/stores/boardStore'

// 取得看板 store 實例
const boardStore = useBoardStore()

</script>

<style>
body {
  font-family: sans-serif;
  background-color: #f4f5f7;
}

.trello-board {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  height: 100vh;
  overflow-x: auto;
}

.column {
  background-color: #ebecf0;
  border-radius: 3px;
  width: 300px;
  padding: 0.5rem;
  flex-shrink: 0;
}

.column-title {
  font-size: 1rem;
  font-weight: bold;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
