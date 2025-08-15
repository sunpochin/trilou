<script setup lang="ts">
import TrelloBoard from '@/components/TrelloBoard.vue';
</script>

<template>
  <div>
    <client-only>
      <TrelloBoard />
      <template #fallback>
        <div class="flex items-center justify-center h-screen bg-gray-100">
          <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p class="text-gray-600">載入中...</p>
          </div>
        </div>
      </template>
    </client-only>
  </div>
</template>