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

// Magic email login 狀態
const emailInput = ref('');
const isEmailLoading = ref(false);

// 處理登出邏輯
const handleLogout = async () => {
  const { error } = await $supabase.auth.signOut();
  if (error) console.error('登出失敗', error);
};

// 處理 Magic Email Login
const signInWithEmail = async () => {
  if (!emailInput.value.trim()) {
    alert('請輸入電子信箱地址');
    return;
  }

  isEmailLoading.value = true;
  try {
    const { error } = await $supabase.auth.signInWithOtp({
      email: emailInput.value.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Magic Email 登入失敗：', error);
      alert(`登入失敗：${error.message}`);
    } else {
      alert('已發送登入連結到您的電子信箱，請檢查您的信箱並點擊連結完成登入。');
      emailInput.value = ''; // 清空輸入框
    }
  } catch (e) {
    console.error('Magic Email 登入流程發生錯誤：', e);
    alert('登入流程發生錯誤，請稍後再試。');
  } finally {
    isEmailLoading.value = false;
  }
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
        
        <!-- 分隔線 -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-300"></div>
          <span class="mx-4 text-sm text-gray-500">或</span>
          <div class="flex-1 border-t border-gray-300"></div>
        </div>
        
        <!-- Magic Email Login 區塊 -->
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2 text-left">
              使用電子信箱登入
            </label>
            <input
              id="email"
              v-model="emailInput"
              type="email"
              placeholder="輸入您的電子信箱"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="isEmailLoading"
              @keyup.enter="signInWithEmail"
            />
          </div>
          
          <button
            @click="signInWithEmail"
            :disabled="isEmailLoading || !emailInput.trim()"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg v-if="isEmailLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span>{{ isEmailLoading ? '發送中...' : '發送登入連結' }}</span>
          </button>
          
          <p class="text-xs text-gray-500 text-center">
            我們會發送一個安全的登入連結到您的信箱
          </p>
        </div>
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
