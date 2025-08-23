import { ref, nextTick, type Ref } from 'vue'
import { useBoardStore } from '@/stores/boardStore'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'

/**
 * 認證相關的 composable
 * 處理使用者登入、登出和認證狀態管理
 */
export const useAuth = () => {
  // 從 Nuxt app 取得 Supabase client
  const { $supabase } = useNuxtApp() as { $supabase: any }
  
  // 取得 Pinia store
  const boardStore = useBoardStore()
  
  // 響應式變數，用於儲存使用者物件
  const user: Ref<User | null> = ref(null)
  
  // 處理登出邏輯
  const handleLogout = async () => {
    const { error } = await $supabase.auth.signOut()
    if (error) console.error('登出失敗', error)
  }

  // 初始化認證狀態監聽
  const initializeAuth = () => {
    console.log('🔧 [AUTH] initializeAuth 開始執行')
    // 追蹤是否已經載入過看板，避免重複載入
    let hasLoadedBoard = false
    
    // 等待一個 tick 確保路由完全載入，特別是 URL 參數
    nextTick(() => {
      // 檢查是否要繞過認證（環境變數或 URL 參數）
      const route = useRoute()
      const config = useRuntimeConfig()
      // 📱 增強手機版繞過檢查
      const skipAuth = config.public.devSkipAuth || 
                       route.query.skipAuth === 'true' ||
                       window.location.search.includes('skipAuth=true')
      console.log('🔍 [AUTH] 認證檢查:', {
        devSkipAuth: config.public.devSkipAuth,
        querySkipAuth: route.query.skipAuth,
        skipAuth: skipAuth,
        route: route.fullPath
      })
      
      if (skipAuth) {
        user.value = { 
          id: "a971548d-298f-4513-883f-a6bd370eff1b", 
          name: "Developer Mode", 
          email: "dev@trilou.local",
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as unknown as User
        
        // 載入看板資料
        if (!hasLoadedBoard) {
          console.log('🚀 [DEV] 開發模式啟用，跳過認證直接載入看板')
          boardStore.fetchBoard()
          hasLoadedBoard = true
        }
        
        return
      }
      
      // 監聽 Supabase 的認證狀態變化
      $supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        const newUser = session?.user ?? null
        const userChanged = user.value?.id !== newUser?.id
        
        console.log('🔐 [AUTH] 認證狀態變化:', { 
          event, 
          userChanged, 
          hasLoadedBoard,
          previousUserId: user.value?.id,
          newUserId: newUser?.id,
          timestamp: new Date().toLocaleTimeString()
        })
        
        user.value = newUser

        if (user.value) {
          // 只在用戶真的變化或首次載入時才獲取看板資料
          if (userChanged && !hasLoadedBoard) {
            console.log('📋 [AUTH] 用戶登入，開始載入看板資料')
            await boardStore.fetchBoard()
            hasLoadedBoard = true
          } else {
            console.log('📋 [AUTH] 跳過重複載入看板資料')
          }
        } else {
          // 如果使用者登出，清空看板資料並重置載入狀態
          console.log('🚪 [AUTH] 用戶登出，清空看板資料')
          boardStore.board.lists = []
          hasLoadedBoard = false
        }
      })
    })
  }

  return {
    user,
    handleLogout,
    initializeAuth
  }
}