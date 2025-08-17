// 建立新卡片的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'
import { ensureUserExists } from '~/server/utils/userHelpers'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const body = await readBody(event)
    
    // 驗證必要欄位
    if (!body.title || !body.list_id) {
      throw createError({
        statusCode: 400,
        message: '卡片標題和列表 ID 為必填欄位'
      })
    }

    // 確保用戶存在於 users 表中（如果不存在則建立）
    await ensureUserExists(supabase, user)

    // 驗證用戶是否有權限在此列表建立卡片（檢查列表是否屬於該用戶）
    const { data: listAccess } = await supabase
      .from('lists')
      .select('user_id')
      .eq('id', body.list_id)
      .single()

    if (!listAccess || listAccess.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        message: '沒有權限在此列表建立卡片'
      })
    }

    // 如果沒有提供 position，自動設定為最後一個位置
    let position = body.position
    if (typeof position !== 'number') {
      // 取得該列表中最大的 position 值
      const { data: lastCard } = await supabase
        .from('cards')
        .select('position')
        .eq('list_id', body.list_id)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      position = lastCard ? lastCard.position + 1 : 0
    }

    // 建立新卡片
    const { data, error } = await supabase
      .from('cards')
      .insert({
        title: body.title,
        description: body.description,
        position: position,
        list_id: body.list_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating card:', error.message)
      throw createError({
        statusCode: 500,
        message: '建立卡片失敗'
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