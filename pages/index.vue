<script setup lang="ts">
import TrelloBoard from '@/components/TrelloBoard.vue';
import { useAuth } from '@/composables/useAuth';

const { user } = useAuth();

// 路由守衛：未登入則導回登入頁面
watchEffect(() => {
  if (!user.value) {
    navigateTo('/login');
  }
});
</script>

<template>
  <TrelloBoard v-if="user" />
</template>
