// 取得列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseClient(event)

    // 🧪 開發模式：允許跳過認證使用固定測試用戶
    let userId: string
    const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
    
    if (skipAuth) {
      // 🎯 開發模式：使用環境變數定義的測試用戶 ID
      userId = process.env.DEV_USER_ID || ""
      console.log('🧪 [DEV-MODE] 獲取列表清單 - 使用開發模式固定用戶 ID:', userId)
    } else {
      // 🔐 生產模式：驗證真實用戶身份
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
      }
      
      userId = user.id
    }

    console.log(`🔍 [LISTS-API] 查詢用戶 ${userId} 的列表`)
    
    // 查詢用戶的列表，按 position 排序
    const { data, error } = await supabase
      .from('lists')
      .select('id, title, position')
      .eq('user_id', userId)
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