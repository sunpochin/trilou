/**
 * 🧪 Vitest 測試配置檔
 * 
 * 🤔 這個檔案做什麼？
 * - 設定測試環境（jsdom 模擬瀏覽器）
 * - 配置路徑別名（@/ 指向專案根目錄）
 * - 設定全域變數和測試工具
 * - 配置覆蓋率報告
 */

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Vue 插件支援
  plugins: [vue()],
  
  // 測試配置
  test: {
    // 全域變數設定（可以直接使用 describe, it, expect 等）
    globals: true,
    
    // 測試環境：jsdom 模擬瀏覽器環境
    environment: 'jsdom',
    
    // 測試設定檔
    setupFiles: ['./tests/setup.ts'],
    
    // 覆蓋率設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      // 覆蓋率門檻
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  
  // 路徑解析配置
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url))
    }
  }
})