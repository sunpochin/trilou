<script setup lang="ts">
import TrelloBoard from '@/components/TrelloBoard.vue';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import InputDialog from '@/components/InputDialog.vue';
import AiTaskModal from '@/components/AiTaskModal.vue';
import { useBoardStore } from '@/stores/boardStore';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useInputDialog } from '@/composables/useInputDialog';
import { MESSAGES } from '@/constants/messages';

// 從 Nuxt app 取得 Supabase client
const { $supabase } = useNuxtApp();
// 取得 Pinia store
const boardStore = useBoardStore();

// 取得確認對話框功能
const { confirmState, handleConfirm, handleCancel } = useConfirmDialog();

// 取得輸入對話框功能
const { inputState, handleConfirm: handleInputConfirm, handleCancel: handleInputCancel } = useInputDialog();

// 響應式變數，用於儲存使用者物件
const user = ref<any>(null);

// AI 生成任務模態框的顯示狀態
const showAiModal = ref(false);

// 處理登出邏輯
const handleLogout = async () => {
  const { error } = await $supabase.auth.signOut();
  if (error) console.error('登出失敗', error);
};

// 在元件掛載後執行
onMounted(() => {
  // 追蹤是否已經載入過看板，避免重複載入
  let hasLoadedBoard = false
  
  // 監聽 Supabase 的認證狀態變化
  $supabase.auth.onAuthStateChange(async (event, session) => {
    const newUser = session?.user ?? null
    const userChanged = user.value?.id !== newUser?.id
    
    console.log('🔐 [APP] 認證狀態變化:', { 
      event, 
      userChanged, 
      hasLoadedBoard,
      previousUserId: user.value?.id,
      newUserId: newUser?.id,
      timestamp: new Date().toLocaleTimeString()
    })
    
    user.value = newUser

    if (user.value) {
      // 只在用戶真的變化或首次載入時才獲取看板資料
      if (userChanged && !hasLoadedBoard) {
        console.log('📋 [APP] 用戶登入，開始載入看板資料')
        await boardStore.fetchBoard()
        hasLoadedBoard = true
      } else {
        console.log('📋 [APP] 跳過重複載入看板資料')
      }
    } else {
      // 如果使用者登出，清空看板資料並重置載入狀態
      console.log('🚪 [APP] 用戶登出，清空看板資料')
      boardStore.board.lists = []
      hasLoadedBoard = false
    }
  });
});
</script>

<template>
  <div>
    <!-- 如果使用者已登入，顯示 Trello 看板和使用者資訊 -->
    <div v-if="user">
      <header class="p-4 bg-gray-200 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold">{{ MESSAGES.board.title }}</h1>
          <button 
            @click="showAiModal = true" 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition-colors duration-200"
          >
            AI 生成任務
          </button>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm">{{ user.email }}</span>
          <button @click="handleLogout" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
            {{ MESSAGES.login.logoutButton }}
          </button>
        </div>
      </header>
      <TrelloBoard />
    </div>

    <!-- 如果使用者未登入，顯示登入頁面 -->
    <div v-else class="flex items-center justify-center h-screen bg-gray-100">
      <div class="p-8 bg-white rounded shadow-md w-full max-w-sm text-center">
        <h1 class="text-2xl font-bold mb-4">{{ MESSAGES.login.welcomeTitle }}</h1>
        <p class="text-lg text-gray-700 mb-6">{{ MESSAGES.login.welcomeSubtitle }}</p>
        <div class="mb-8 space-y-2">
          <p class="text-gray-600 font-medium">{{ MESSAGES.login.googlePrompt }}</p>
          <p class="text-sm text-gray-500">{{ MESSAGES.login.privacyNote }}</p>
        </div>
        <GoogleLoginButton />
      </div>
    </div>

    <!-- 全域確認對話框 -->
    <ConfirmDialog
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-text="confirmState.confirmText"
      :cancel-text="confirmState.cancelText"
      :danger-mode="confirmState.dangerMode"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 全域輸入對話框 -->
    <InputDialog
      :show="inputState.show"
      :title="inputState.title"
      :message="inputState.message"
      :placeholder="inputState.placeholder"
      :confirm-text="inputState.confirmText"
      :cancel-text="inputState.cancelText"
      :initial-value="inputState.initialValue"
      @confirm="handleInputConfirm"
      @cancel="handleInputCancel"
    />

    <!-- AI 任務生成模態框 -->
    <AiTaskModal
      :show="showAiModal"
      @close="showAiModal = false"
    />
  </div>
</template>
