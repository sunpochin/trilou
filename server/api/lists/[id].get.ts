// 獲取特定列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用環境變數定義的測試用戶 ID
    userId = process.env.DEV_USER_ID || ""
    console.log('🧪 [DEV-MODE] 獲取列表 - 使用開發模式固定用戶 ID:', userId)
  } else {
    // 🔐 生產模式：驗證真實用戶身份
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    userId = user.id
  }

  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '列表 ID 為必填參數'
      })
    }

    // 簡化查詢：直接查詢用戶的列表
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('Error fetching list:', error.message)
      throw createError({
        statusCode: 500,
        message: '獲取列表資料失敗'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: '找不到指定的列表或您沒有權限存取'
      })
    }

    return data
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    console.error('Unexpected error:', error)
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})