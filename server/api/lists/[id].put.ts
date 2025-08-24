// 更新列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用環境變數定義的測試用戶 ID
    userId = process.env.DEV_USER_ID || ""
    console.log('🧪 [DEV-MODE] 更新列表 - 使用開發模式固定用戶 ID:', userId)
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
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '列表 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && typeof body.position !== 'number') {
      throw createError({
        statusCode: 400,
        message: '至少需要提供一個要更新的欄位'
      })
    }

    // 如果有提供 position，驗證是否為有效數字
    if (typeof body.position === 'number' && body.position < 0) {
      throw createError({
        statusCode: 400,
        message: '位置必須為非負數'
      })
    }

    // 驗證用戶是否有權限編輯此列表（檢查列表是否屬於用戶）
    const { data: listAccess, error: accessError } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', id)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤，交由下方 !listAccess 處理為 403

    // 處理真正的查詢錯誤
    if (accessError) {
      console.error('Error checking list access:', accessError.message)
      throw createError({
        statusCode: 500,
        message: '檢查列表權限失敗'
      })
    }

    if (!listAccess || listAccess.user_id !== userId) {
      throw createError({
        statusCode: 403,
        message: '沒有權限編輯此列表'
      })
    }

    // 準備更新資料
    const updateData: any = {}
    if (body.title) updateData.title = body.title
    if (typeof body.position === 'number') updateData.position = body.position

    // 更新列表
    const { data, error } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('Error updating list:', error.message)
      throw createError({
        statusCode: 500,
        message: '更新列表失敗'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: '找不到要更新的列表'
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