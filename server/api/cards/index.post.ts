// 建立新卡片的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'
import { ensureUserExists } from '@/server/utils/userHelpers'

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

    // 並行執行權限檢查和獲取 position，減少等待時間
    const [listAccessResult, lastCardResult] = await Promise.all([
      // 驗證用戶是否有權限在此列表建立卡片
      supabase
        .from('lists')
        .select('user_id')
        .eq('id', body.list_id)
        .maybeSingle(), // ✅ 查無資料時不回傳錯誤
      // 同時取得該列表中最大的 position 值（如果需要的話）
      typeof body.position !== 'number' ? 
        supabase
          .from('cards')
          .select('position')
          .eq('list_id', body.list_id)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle() : // 使用 maybeSingle 避免沒有卡片時的錯誤
        Promise.resolve({ data: null, error: null })
    ])

    // 處理查詢錯誤
    if (listAccessResult.error) {
      console.error('Error checking list access:', listAccessResult.error.message)
      throw createError({
        statusCode: 500,
        message: '檢查列表權限失敗'
      })
    }

    // 檢查權限
    if (!listAccessResult.data || listAccessResult.data.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        message: '沒有權限在此列表建立卡片'
      })
    }

    // 設定 position
    let position = body.position
    if (typeof position !== 'number') {
      position = lastCardResult.data ? lastCardResult.data.position + 1 : 0
    }

    // 建立新卡片
    const { data, error } = await supabase
      .from('cards')
      .insert({
        title: body.title,
        description: body.description,
        position: position,
        list_id: body.list_id,
        status: body.status  // 包含 AI 生成任務的狀態標籤
      })
      .select()
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('Error creating card:', error.message)
      throw createError({
        statusCode: 500,
        message: '建立卡片失敗'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 500,
        message: '建立卡片失敗：無法取得新卡片資料'
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