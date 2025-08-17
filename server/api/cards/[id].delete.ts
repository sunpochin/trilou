// 刪除卡片的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '卡片 ID 為必填參數'
      })
    }

    // 先驗證用戶是否有權限刪除此卡片（檢查卡片所屬的列表是否屬於用戶）
    const { data: cardAccess } = await supabase
      .from('cards')
      .select(`
        lists!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('lists.user_id', user.id)
      .single()

    if (!cardAccess) {
      throw createError({
        statusCode: 403,
        message: '沒有權限刪除此卡片'
      })
    }

    // 刪除卡片
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting card:', error.message)
      throw createError({
        statusCode: 500,
        message: '刪除卡片失敗'
      })
    }

    return { id }
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