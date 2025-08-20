// 更新列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
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
    const { data: listAccess } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!listAccess || listAccess.user_id !== user.id) {
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
      .single()

    if (error) {
      console.error('Error updating list:', error.message)
      throw createError({
        statusCode: 500,
        message: '更新列表失敗'
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