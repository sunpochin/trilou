// Pinia 伺服器端插件配置
import { createPinia } from 'pinia'

export default defineNuxtPlugin((nuxtApp) => {
  // 建立 Pinia 實例
  const pinia = createPinia()
  
  // 將 Pinia 註冊到 Vue 應用程式
  nuxtApp.vueApp.use(pinia)
  
  // 設定 Pinia 為全域可用
  nuxtApp.provide('pinia', pinia)
  
  return {
    provide: {
      pinia
    }
  }
})