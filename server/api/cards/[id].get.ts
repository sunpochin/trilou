// 獲取特定卡片的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片 ID 為必填參數'
      })
    }

    // 查詢卡片並驗證用戶是否有權限存取（簡化查詢）
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        lists!inner (
          id,
          title,
          user_id
        )
      `)
      .eq('id', id)
      .eq('lists.user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching card:', error.message)
      throw createError({
        statusCode: error.code === 'PGRST116' ? 404 : 500,
        statusMessage: error.code === 'PGRST116' ? '找不到指定的卡片或您沒有權限存取' : '獲取卡片資料失敗'
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
      statusMessage: '伺服器內部錯誤'
    })
  }
})