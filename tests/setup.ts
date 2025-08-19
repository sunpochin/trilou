/**
 * 🔧 測試環境設定檔
 * 
 * 🤔 這個檔案做什麼？
 * - 匯入測試工具的擴展方法
 * - 設定全域 Mock 函數
 * - 配置測試環境的預設行為
 */

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { ref, readonly } from 'vue'
import { defineStore } from 'pinia'

// 全域 Mock Vue 和 Pinia
global.ref = ref
global.readonly = readonly
global.defineStore = defineStore

// 全域 Mock Nuxt 的 $fetch 函數
global.$fetch = vi.fn()

// 全域 Mock console 方法，避免測試時輸出雜訊
const originalConsole = global.console
global.console = {
  ...originalConsole,
  // 保留 error 和 warn，因為測試時可能需要看到
  error: vi.fn(),
  warn: vi.fn(),
  // Mock 掉 log, debug, info
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
}

// Mock Vue Router（如果測試中需要）
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    path: '/test',
    query: {},
    params: {}
  })
}))

// Mock Nuxt Composables（如果測試中需要）
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $fetch: global.$fetch
  })
}))

// 每個測試前的清理工作
beforeEach(() => {
  // 清除所有 Mock 的呼叫記錄
  vi.clearAllMocks()
})