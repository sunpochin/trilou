// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url'

export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { 
          name: 'viewport', 
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' 
        }
      ]
    }
  },
  devServer: {
    host: '0.0.0.0', // 讓外部可連進來
    port: 3000,
  },
  vite: {
    server: {
      host: '0.0.0.0',
      allowedHosts: [
        'gogo.sunpochin.space', // 👈 加上你的固定 Tunnel 網域
      ],
      hmr: {
        protocol: 'wss',
        host: 'gogo.sunpochin.space',
        port: 443,
      },
    },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: '.',
  alias: {
    '@': fileURLToPath(new URL('.', import.meta.url)),
    '~': fileURLToPath(new URL('.', import.meta.url))
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  // 將環境變數暴露給前端使用
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
      },
      // 開發模式認證繞過設定
      devSkipAuth: process.env.DEV_SKIP_AUTH === 'true'
    }
  },

  // 開發模式代理設定已移除，現在使用本地 API 端點
})
