<script setup lang="ts">
import TrelloBoard from '@/components/TrelloBoard.vue';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';
import { useBoardStore } from '@/stores/boardStore';

// 從 Nuxt app 取得 Supabase client
const { $supabase } = useNuxtApp();
// 取得 Pinia store
const boardStore = useBoardStore();

// 響應式變數，用於儲存使用者物件
const user = ref<any>(null);

// 處理登出邏輯
const handleLogout = async () => {
  const { error } = await $supabase.auth.signOut();
  if (error) console.error('登出失敗', error);
};

// 在元件掛載後執行
onMounted(() => {
  // 監聽 Supabase 的認證狀態變化
  $supabase.auth.onAuthStateChange(async (event, session) => {
    user.value = session?.user ?? null;

    if (user.value) {
      // 如果使用者登入，就去後端獲取看板資料
      await boardStore.fetchBoard();
    } else {
      // 如果使用者登出，清空看板資料
      boardStore.board.lists = [];
    }
  });
});
</script>

<template>
  <div>
    <!-- 如果使用者已登入，顯示 Trello 看板和使用者資訊 -->
    <div v-if="user">
      <header class="p-4 bg-gray-200 flex justify-between items-center">
        <h1 class="text-xl font-bold">Trilo 看板</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm">{{ user.email }}</span>
          <button @click="handleLogout" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm">登出</button>
        </div>
      </header>
      <TrelloBoard />
    </div>

    <!-- 如果使用者未登入，顯示登入頁面 -->
    <div v-else class="flex items-center justify-center h-screen bg-gray-100">
      <div class="p-8 bg-white rounded shadow-md w-full max-w-sm text-center">
        <h1 class="text-2xl font-bold mb-6">歡迎來到催落(Trilo), 您的記事小幫手 </h1>
        <p class="text-gray-600 mb-8">請用 Goolge Acount 登入</p>
        <GoogleLoginButton />
      </div>
    </div>
  </div>
</template>
