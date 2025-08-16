import { defineNuxtPlugin } from '#app'
import { createBrowserClient } from '@supabase/ssr'

export default defineNuxtPlugin(nuxtApp => {
  // 繁體中文註解：定義一個 Nuxt 插件，'.client.ts' 後綴表示只在客戶端執行

  // 繁體中文註解：從 runtimeConfig 取得公開的 Supabase 設定
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabase.url as string
  const supabaseKey = config.public.supabase.key as string

  // 繁體中文註解：建立 Supabase 瀏覽器客戶端實例
  const supabase = createBrowserClient(supabaseUrl, supabaseKey)

  // 繁體中文註解：將 supabase 實例注入到 Nuxt app 中，使其全域可用
  // 之後可以透過 const { $supabase } = useNuxtApp() 來存取
  nuxtApp.provide('supabase', supabase)
})
