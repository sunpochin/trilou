<template>
  <!-- 🍞 Toast 通知容器 - 固定在右上角 -->
  <div 
    v-if="toasts.length > 0"
    class="fixed top-4 right-4 z-50 space-y-2"
  >
    <!-- 單個 Toast 項目 -->
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="[
        'px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out',
        'flex items-center justify-between min-w-80 max-w-96',
        toast.type === 'success' && 'bg-green-50 border border-green-200 text-green-800',
        toast.type === 'error' && 'bg-red-50 border border-red-200 text-red-800',
        toast.type === 'info' && 'bg-blue-50 border border-blue-200 text-blue-800',
        toast.type === 'warning' && 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      ]"
    >
      <!-- 圖標區域 -->
      <div class="flex items-center">
        <!-- 成功圖標 -->
        <svg 
          v-if="toast.type === 'success'"
          class="w-5 h-5 mr-3 text-green-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <!-- 錯誤圖標 -->
        <svg 
          v-else-if="toast.type === 'error'"
          class="w-5 h-5 mr-3 text-red-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <!-- 資訊圖標 -->
        <svg 
          v-else-if="toast.type === 'info'"
          class="w-5 h-5 mr-3 text-blue-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        
        <!-- 警告圖標 -->
        <svg 
          v-else-if="toast.type === 'warning'"
          class="w-5 h-5 mr-3 text-yellow-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>

        <!-- 訊息內容 -->
        <div>
          <!-- 標題（可選） -->
          <h4 v-if="toast.title" class="font-medium text-sm">
            {{ toast.title }}
          </h4>
          <!-- 訊息內容 -->
          <p :class="toast.title ? 'text-sm mt-1' : 'text-sm'">
            {{ toast.message }}
          </p>
        </div>
      </div>

      <!-- 關閉按鈕 -->
      <button
        @click="removeToast(toast.id)"
        class="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 🍞 ToastNotification = Toast 通知顯示組件
 * 
 * 🎯 這個組件負責什麼？
 * - 顯示各種類型的 Toast 通知（成功、錯誤、資訊、警告）
 * - 自動移除過期的通知
 * - 提供手動關閉按鈕
 * - 支援多個通知同時顯示
 * 
 * 🌟 特色：
 * - 固定在右上角顯示
 * - 支援 4 種通知類型，每種都有對應的圖標和顏色
 * - 漸入漸出動畫效果
 * - 響應式設計，適配不同螢幕尺寸
 */

// 引入 Toast 相關的 composable
import { useToast } from '@/composables/useToast'

// 取得 Toast 狀態和操作函數
const { toasts, removeToast } = useToast()
</script>