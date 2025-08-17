// 建立新列表的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'
import { ensureUserExists } from '~/server/utils/userHelpers'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const body = await readBody(event)
    
    // 驗證必要欄位
    if (!body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: '列表標題為必填欄位'
      })
    }

    // 確保用戶存在於 users 表中（如果不存在則建立）
    await ensureUserExists(supabase, user)

    // 如果沒有提供 position，自動設定為最後一個位置
    let position = body.position
    if (typeof position !== 'number') {
      // 取得該用戶最大的 position 值
      const { data: lastList } = await supabase
        .from('lists')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1)
        .single()
      
      position = lastList ? lastList.position + 1 : 0
    }

    // 建立新列表
    const { data, error } = await supabase
      .from('lists')
      .insert({
        title: body.title,
        user_id: user.id,
        position: position
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating list:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: '建立列表失敗'
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