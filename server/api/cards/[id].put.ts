// 更新卡片的 API 端點
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
    const body = await readBody(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && !body.description && typeof body.position !== 'number' && !body.list_id && !body.due_date) {
      throw createError({
        statusCode: 400,
        statusMessage: '至少需要提供一個要更新的欄位'
      })
    }

    // 如果有提供 position，驗證是否為有效數字
    if (typeof body.position === 'number' && body.position < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '位置必須為非負數'
      })
    }

    // 首先驗證用戶是否有權限編輯此卡片（檢查卡片所屬的列表是否屬於用戶）
    const { data: cardAccess } = await supabase
      .from('cards')
      .select(`
        list_id,
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
        statusMessage: '沒有權限編輯此卡片'
      })
    }

    // 如果要移動卡片到不同列表，需要驗證目標列表是否也屬於用戶
    if (body.list_id && body.list_id !== cardAccess.list_id) {
      const { data: targetListAccess } = await supabase
        .from('lists')
        .select('user_id')
        .eq('id', body.list_id)
        .single()

      if (!targetListAccess || targetListAccess.user_id !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: '沒有權限將卡片移動到目標列表'
        })
      }
    }

    // 準備更新資料
    const updateData: any = {}
    if (body.title) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (typeof body.position === 'number') updateData.position = body.position
    if (body.list_id) updateData.list_id = body.list_id
    if (body.due_date !== undefined) updateData.due_date = body.due_date

    // 更新卡片
    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating card:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: '更新卡片失敗'
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