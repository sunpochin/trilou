// 取得列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseClient(event)

    let user = null
    
    // 檢查開發模式繞過認證
    if (process.env.DEV_SKIP_AUTH === 'true') {
      console.log('🚀 [DEV] 開發模式啟用，跳過 API 認證')
      user = { 
        id: process.env.DEV_USER_ID || "a971548d-298f-4513-883f-a6bd370eff1b" 
      }
    } else {
      // 驗證用戶身份
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (!authUser) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
      }
      
      user = authUser
    }

    console.log(`🔍 [LISTS-API] 查詢用戶 ${user.id} 的列表`)
    
    // 查詢用戶的列表，按 position 排序
    const { data, error } = await supabase
      .from('lists')
      .select('id, title, position')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('❌ [LISTS-API] Error fetching lists:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得列表失敗'
      })
    }

    console.log(`📊 [LISTS-API] 查詢結果: 找到 ${data?.length || 0} 個列表`)
    console.log('📋 [LISTS-API] 列表詳情:', data)
    
    return data || []
  } catch (error) {
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})