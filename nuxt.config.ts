// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath, URL } from 'node:url'

export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { 
          name: 'viewport', 
          content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' 
        }
      ]
    }
  },
  // Dev Server 對外開放
  server: {
    host: '0.0.0.0',
    port: 3000,
  },


  nitro: {
    compressPublicAssets: false,
  },
  vite: {
    server: {
      host: '0.0.0.0',
      allowedHosts: ['sunpochin.space'],
      hmr: {
        protocol: 'wss',
        host: 'sunpochin.space',
        port: 443,
      },
      headers: {
        'Cache-Control': 'no-store',
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
