import { ref, type Ref } from 'vue'
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
    // 檢查是否為開發模式，如果是就直接清除用戶資料
    const route = useRoute()
    const config = useRuntimeConfig()
    const skipAuth = config.public.devSkipAuth || 
                     route.query.skipAuth === 'true' ||
                     window.location.search.includes('skipAuth=true')
    
    if (skipAuth) {
      console.log('🚪 [DEV] 開發模式登出，清除本地資料')
      user.value = null
      boardStore.board.lists = []
      // 重新導向到首頁並移除 skipAuth 參數
      await navigateTo('/')
      return
    }
    
    // 正常 Supabase 登出流程
    const { error } = await $supabase.auth.signOut()
    if (error) {
      console.error('登出失敗', error)
    } else {
      console.log('✅ [AUTH] 正常登出成功')
      user.value = null
      boardStore.board.lists = []
    }
  }

  // 防止重複初始化
  let isInitialized = false
  
  // 初始化認證狀態監聽
  const initializeAuth = () => {
    console.log('🔧 [AUTH] initializeAuth 被調用，檢查是否已初始化:', isInitialized)
    if (isInitialized) {
      console.log('⚠️ [AUTH] 已經初始化過，跳過重複初始化')
      return
    }
    isInitialized = true
    
    console.log('🔧 [AUTH] initializeAuth 開始執行，準備檢查認證邏輯')
    // 追蹤是否已經載入過看板，避免重複載入
    let hasLoadedBoard = false
    
    // 檢查是否要繞過認證（環境變數或 URL 參數）
    console.log('🔍 [AUTH] 開始取得 route 和 config')
    const route = useRoute()
    const config = useRuntimeConfig()
    console.log('🔍 [AUTH] route 和 config 取得完成')
    
    // 📱 URL 參數優先檢查
    const urlSkipAuth = route.query.skipAuth
    const hasSkipAuthInUrl = window.location.search.includes('skipAuth=true')
    
    // 🎯 決定是否跳過認證的邏輯：
    // 1. 如果 URL 明確指定 skipAuth=true → 開發模式
    // 2. 如果 URL 沒有 skipAuth 參數且環境變數為 true → 開發模式  
    let skipAuth = false
    if (urlSkipAuth === 'true' || hasSkipAuthInUrl || config.public.devSkipAuth) {
      skipAuth = true
    }

    console.log('🔍 [AUTH] 認證檢查 - 詳細除錯:', {
      devSkipAuth: config.public.devSkipAuth,
      urlSkipAuth: urlSkipAuth,
      hasSkipAuthInUrl: hasSkipAuthInUrl,
      windowSearch: window.location.search,
      route: route.fullPath,
      skipAuth: skipAuth,
      '🚨 決定因素': urlSkipAuth === 'true' ? 'URL=true' : 
                    urlSkipAuth === 'false' ? 'URL=false' :
                    urlSkipAuth === undefined && config.public.devSkipAuth ? 'ENV=true' : '正常模式',
      '🚨 最終決定': skipAuth ? '開發模式' : '正常模式'
    })
    
    // 🎯 如果是開發模式，直接設置開發者用戶並返回
    if (skipAuth) {
      console.log('🚀 [DEV] 開發模式啟用，設置開發者用戶，跳過 Supabase')
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
        console.log('📋 [DEV] 載入開發模式看板')
        boardStore.fetchBoard()
        hasLoadedBoard = true
      }
      return // 🎯 關鍵：開發模式直接返回，不設置 Supabase 監聽器
    }
    
    // 🎯 只有非開發模式才設置 Supabase 認證監聽器
    console.log('✅ [AUTH] 正常模式，設置 Supabase 認證監聽器')
    $supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const newUser = session?.user ?? null
      const userChanged = user.value?.id !== newUser?.id
      
      console.log('🔐 [AUTH] Supabase 認證狀態變化:', { 
        event, 
        userChanged, 
        hasLoadedBoard,
        previousUserId: user.value?.id,
        newUserId: newUser?.id,
        email: newUser?.email,
        timestamp: new Date().toLocaleTimeString()
      })
      
      user.value = newUser

      if (user.value) {
        // 只在用戶真的變化或首次載入時才獲取看板資料
        if (userChanged && !hasLoadedBoard) {
          console.log('📋 [AUTH] 真實用戶登入，開始載入看板資料')
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
  }

  return {
    user,
    handleLogout,
    initializeAuth
  }
}