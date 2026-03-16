<script setup lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import InputDialog from '@/components/InputDialog.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useInputDialog } from '@/composables/useInputDialog';
import { useAuth } from '@/composables/useAuth';
import { MESSAGES } from '@/constants/messages';
import { useRoute } from 'vue-router';

// 取得確認對話框功能
const { confirmState, handleConfirm, handleCancel } = useConfirmDialog();

// 取得輸入對話框功能
const { inputState, handleConfirm: handleInputConfirm, handleCancel: handleInputCancel } = useInputDialog();

// 取得認證相關功能
const { user, handleLogout } = useAuth();
const route = useRoute();

// 是否顯示 Header 和 Footer (如果登入且不在登入頁)
const showHeaderFooter = computed(() => {
  return user.value && route.path !== '/login';
});
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- 使用 ClientOnly 避免 hydration mismatch -->
    <ClientOnly>
      <!-- 🎨 Header -->
      <header v-if="showHeaderFooter" class="bg-gray-200 border-b border-gray-300">
        <!-- 第一層：標題和使用者資訊 -->
        <div class="px-4 py-3 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-800">{{ MESSAGES.board.title }}</h1>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 hidden sm:inline">{{ user?.email }}</span>
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
        <slot />
      </div>
      
      <!-- 底部 Footer -->
      <footer v-if="showHeaderFooter" class="bg-gray-100 border-t border-gray-200 py-2 px-4">
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
