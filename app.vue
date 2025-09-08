<script setup lang="ts">
import TrelloBoard from '@/components/TrelloBoard.vue';
import GoogleLoginButton from '@/components/GoogleLoginButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import InputDialog from '@/components/InputDialog.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useBoardStore } from '@/stores/boardStore';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useInputDialog } from '@/composables/useInputDialog';
import { useAuth } from '@/composables/useAuth';
import { MESSAGES } from '@/constants/messages';
import { computed } from 'vue';
import { eventBus } from '@/events/EventBus';

// 從 Nuxt app 取得 Supabase client
const { $supabase } = useNuxtApp();
// 取得 Pinia store
const boardStore = useBoardStore();

// 取得認證相關功能
const { user, handleLogout, initializeAuth } = useAuth();


// 取得確認對話框功能
const { confirmState, handleConfirm, handleCancel } = useConfirmDialog();

// 取得輸入對話框功能
const { inputState, handleConfirm: handleInputConfirm, handleCancel: handleInputCancel } = useInputDialog();



// Magic email login 狀態
const emailInput = ref('');
const isEmailLoading = ref(false);


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

// 執行認證初始化（在客戶端掛載時）
onMounted(() => {
  // 只在客戶端掛載後執行初始化
  initializeAuth()
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- 使用 ClientOnly 避免 hydration mismatch -->
    <ClientOnly>
      <!-- 如果使用者已登入，顯示 Trello 看板和使用者資訊 -->
      <div v-if="user">
      <!-- 🎨 重新設計的 Header - 分兩層不會擠！ -->
      <header class="bg-gray-200 border-b border-gray-300">
        <!-- 第一層：標題和使用者資訊 -->
        <div class="px-4 py-3 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-800">{{ MESSAGES.board.title }}</h1>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 hidden sm:inline">{{ user.email }}</span>
            <button 
              @click="handleLogout" 
              class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
            >
              {{ MESSAGES.login.logoutButton }}
            </button>
          </div>
        </div>
        
      </header>
      
      <!-- 主要內容區域 -->
      <div class="flex-1 overflow-hidden">
        <TrelloBoard />
      </div>
      
      <!-- 底部 GitHub 來源和作者資訊 -->
      <footer class="bg-gray-100 border-t border-gray-200 py-2 px-4">
        <div class="flex justify-center items-center gap-4 text-xs text-gray-500">
          <span>
            <a 
              href="https://github.com/sunpochin/trilou" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-500 hover:text-blue-600 underline"
            >
              Source code on GitHub
            </a>
          </span>
          <span class="text-gray-300">|</span>
          <span>
            Made with ❤️ by 
            <a 
              href="https://github.com/sunpochin" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-500 hover:text-blue-600 underline"
            >
              sunpochin
            </a>
          </span>
        </div>
      </footer>
    </div>

    <!-- 如果使用者未登入，顯示登入頁面 -->
    <div v-else class="flex items-center justify-center h-screen bg-gray-100">
      <div class="p-8 bg-white rounded shadow-md w-full max-w-sm text-center">
        <h1 class="text-2xl font-bold mb-4">{{ MESSAGES.login.welcomeTitle }}</h1>
        <p class="text-lg text-gray-700 mb-6">{{ MESSAGES.login.welcomeSubtitle }}</p>
        <div class="mb-8 space-y-2">
          <p class="text-sm text-gray-500">{{ MESSAGES.login.privacyNote }}</p>
          <GoogleLoginButton />
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
        
        <!-- GitHub 來源和作者資訊 -->
        <div class="mt-6 pt-4 border-t border-gray-200 text-center space-y-2">
          <p class="text-xs text-gray-400">
            <a 
              href="https://github.com/sunpochin/trilou" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-500 hover:text-blue-600 underline"
            >
              Source code on GitHub
            </a>
          </p>
          <p class="text-xs text-gray-400">
            Made with ❤️ by 
            <a 
              href="https://github.com/sunpochin" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-500 hover:text-blue-600 underline"
            >
              sunpochin
            </a>
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

    </ClientOnly>

    <!-- 全域 Toast 通知 -->
    <ToastNotification />

  </div>
</template>

<style scoped>
/* 🎨 AI 按鈕的神秘魔法效果 */
.ai-button-magic {
  background: linear-gradient(45deg, #3B82F6, #6366F1, #8B5CF6, #3B82F6);
  background-size: 400% 400%;
  animation: magicGlow 4s ease-in-out infinite;
  position: relative;
}

.ai-button-magic::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3B82F6, #6366F1, #8B5CF6, #A855F7, #3B82F6);
  background-size: 400% 400%;
  border-radius: inherit;
  z-index: -1;
  animation: magicBorder 3s ease-in-out infinite;
  opacity: 0.7;
}

.ai-button-magic:hover {
  animation: magicGlowFast 2s ease-in-out infinite;
  transform: translateY(-1px);
}

/* 🌟 生成中的強化魔法效果 */
.ai-generating-magic {
  background: linear-gradient(45deg, #7C3AED, #3B82F6, #EC4899, #F59E0B, #7C3AED);
  background-size: 800% 800%;
  animation: generatingMagic 1.5s ease-in-out infinite;
  position: relative;
}

.ai-generating-magic::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #7C3AED, #3B82F6, #EC4899, #F59E0B, #10B981, #7C3AED);
  background-size: 1000% 1000%;
  border-radius: inherit;
  z-index: -1;
  animation: generatingBorder 1s ease-in-out infinite;
  opacity: 0.9;
}

.ai-generating-magic::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: inherit;
  transform: translate(-50%, -50%);
  animation: magicPulse 2s ease-in-out infinite;
}

/* 🎭 動畫關鍵幀定義 */
@keyframes magicGlow {
  0%, 100% {
    background-position: 0% 50%;
    filter: brightness(1) saturate(1);
  }
  25% {
    background-position: 100% 50%;
    filter: brightness(1.1) saturate(1.2);
  }
  50% {
    background-position: 50% 100%;
    filter: brightness(1.2) saturate(1.3);
  }
  75% {
    background-position: 0% 100%;
    filter: brightness(1.1) saturate(1.2);
  }
}

@keyframes magicGlowFast {
  0%, 100% {
    background-position: 0% 50%;
    filter: brightness(1.2) saturate(1.3);
  }
  50% {
    background-position: 100% 50%;
    filter: brightness(1.4) saturate(1.5);
  }
}

@keyframes magicBorder {
  0%, 100% {
    background-position: 0% 50%;
    opacity: 0.5;
  }
  50% {
    background-position: 100% 50%;
    opacity: 0.8;
  }
}

@keyframes generatingMagic {
  0% {
    background-position: 0% 50%;
    filter: brightness(1.3) saturate(1.5) hue-rotate(0deg);
  }
  33% {
    background-position: 100% 50%;
    filter: brightness(1.5) saturate(1.7) hue-rotate(120deg);
  }
  66% {
    background-position: 50% 100%;
    filter: brightness(1.4) saturate(1.6) hue-rotate(240deg);
  }
  100% {
    background-position: 0% 50%;
    filter: brightness(1.3) saturate(1.5) hue-rotate(360deg);
  }
}

@keyframes generatingBorder {
  0% {
    background-position: 0% 50%;
    opacity: 0.7;
    filter: blur(0px);
  }
  50% {
    background-position: 100% 50%;
    opacity: 1;
    filter: blur(1px);
  }
  100% {
    background-position: 0% 50%;
    opacity: 0.7;
    filter: blur(0px);
  }
}

@keyframes magicPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 🌈 額外的魔法粒子效果（為按鈕添加更多神秘感） */
.ai-button-magic:hover::after,
.ai-generating-magic::after {
  animation: magicPulse 1.5s ease-in-out infinite;
}

/* 🌈 Countdown 顯示的彩虹漸層效果 */
.countdown-display {
  background: linear-gradient(
    45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 綠 */
    #00ff80,  /* 青 */
    #0080ff,  /* 藍 */
    #8000ff,  /* 靛 */
    #ff0080   /* 紫 */
  );
  background-size: 800% 100%;
  animation: rainbowFlow 6s ease-in-out infinite;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.countdown-display::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    45deg,
    #ff0000,  /* 紅 */
    #ff8000,  /* 橘 */
    #ffff00,  /* 黃 */
    #80ff00,  /* 綠 */
    #00ff80,  /* 青 */
    #0080ff,  /* 藍 */
    #8000ff,  /* 靛 */
    #ff0080   /* 紫 */
  );
  background-size: 800% 100%;
  border-radius: inherit;
  z-index: -1;
  animation: rainbowFlow 6s ease-in-out infinite;
  opacity: 0.6;
  filter: blur(4px);
}

/* 🕐 時鐘轉動動畫 */
.clock-icon {
  animation: clockRotate 4s linear infinite;
  transform-origin: center;
}

/* 🌈 彩虹流動動畫 */
@keyframes rainbowFlow {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 200% 50%;
  }
  75% {
    background-position: 300% 50%;
  }
  100% {
    background-position: 400% 50%;
  }
}

/* 🕐 時鐘轉動動畫 */
@keyframes clockRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 📱 手機版拖拽全局樣式 - 修復版本 */
.sortable-fallback,
.card-fallback {
  opacity: 0.8 !important;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3) !important;
  border: 2px solid #10b981 !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.95) !important;
  /* 移除會導致問題的樣式：rotate, position fixed, pointer-events none */
}

/* 📱 手機版拖拽時的觸摸區域 */
body.mobile-dragging {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none !important;
}

/* 📱 拖拽過程中防止滾動 */
.sortable-drag-active {
  overflow: hidden !important;
}

/* 🎯 全域修正：防止任何元素出現藍色 focus 外框 */
*:focus {
  outline: none !important;
}




/* 🎯 防止瀏覽器預設的選取高亮 */
::selection {
  background: rgba(59, 130, 246, 0.1);
}

::-moz-selection {
  background: rgba(59, 130, 246, 0.1);
}
</style>
