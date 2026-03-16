<script setup lang="ts">
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';
import { useAuth } from '@/composables/useAuth';
import { MESSAGES } from '@/constants/messages';
import { eventBus } from '@/events/EventBus';

// 取得認證相關功能
const { user } = useAuth();
// 從 Nuxt app 取得 Supabase client
const { $supabase } = useNuxtApp() as unknown as { $supabase: any };

// Magic email login 狀態
const emailInput = ref('');
const isEmailLoading = ref(false);

// 路由守衛：如果已經登入，直接跳轉到首頁
watchEffect(() => {
  if (user.value) {
    navigateTo('/');
  }
});

// 導航到測試帳號頁面
const navigateToTestAccount = () => {
  window.location.href = window.location.origin + '?skipAuth=true';
};

// 處理 Magic Email Login
const signInWithEmail = async () => {
  if (!emailInput.value.trim()) {
    eventBus.emit('notification:error', {
      title: '輸入錯誤',
      message: '請輸入電子信箱地址'
    });
    return;
  }

  isEmailLoading.value = true;
  try {
    const { error } = await $supabase.auth.signInWithOtp({
      email: emailInput.value.trim(),
      options: {
        emailRedirectTo: import.meta.client ? `${window.location.origin}/` : 'https://gogo.sunpochin.space/'
      }
    });

    if (error) {
      console.error('Magic Email 登入失敗：', error);
      eventBus.emit('notification:error', {
        title: '登入失敗',
        message: `登入失敗：${error.message}`
      });
    } else {
      eventBus.emit('notification:show', {
        type: 'success',
        message: '已發送登入連結到您的電子信箱，請檢查您的信箱並點擊連結完成登入。'
      });
      emailInput.value = ''; // 清空輸入框
    }
  } catch (e) {
    console.error('Magic Email 登入流程發生錯誤：', e);
    eventBus.emit('notification:error', {
      title: '系統錯誤',
      message: '登入流程發生錯誤，請稍後再試。'
    });
  } finally {
    isEmailLoading.value = false;
  }
};
</script>

<template>
  <div class="flex items-center justify-center h-screen bg-gray-100 w-full" v-if="!user">
    <div class="p-8 bg-white rounded shadow-md w-full max-w-sm text-center transform transition-all">
      <h1 class="text-2xl font-bold mb-4">{{ MESSAGES.login.welcomeTitle }}</h1>
      <p class="text-lg text-gray-700 mb-6">{{ MESSAGES.login.welcomeSubtitle }}</p>
      
      <div class="mb-8 space-y-2">
        <p class="text-sm text-gray-500">{{ MESSAGES.login.privacyNote }}</p>
        <GoogleLoginButton />
        <!-- 測試帳號登入按鈕 -->
        <div class="flex justify-center">
          <button
            @click="navigateToTestAccount"
            class="test-login-btn"
          >
            <svg
              class="test-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>使用測試帳號</span>
          </button>
        </div>
      </div>
      
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
</template>

<!-- 使用與原本相同的 scoped 樣式 -->
<style scoped>
/* 測試帳號登入按鈕樣式 - 與 Google 按鈕一致 */
.test-login-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background-color: white;
  border: 2px solid #dadce0;
  border-radius: 0.5rem;
  color: #3c4043;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 180px; /* 比 Google 按鈕稍窄 */
}

.test-login-btn:hover {
  background-color: #f8f9fa;
  border-color: #dadce0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.test-login-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #5f6368;
}
</style>
