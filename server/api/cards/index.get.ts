// 取得卡片的 API 端點（可依列表 ID 篩選）
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份 - 確保只有登入的用戶可以存取
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    // 從 URL query 參數中取得 list_id（可選的篩選條件）
    // 例如：/api/cards?list_id=123 會只回傳該列表的卡片
    const urlQuery = getQuery(event)
    const listId = urlQuery.list_id as string

    /*
    * 優化後的查詢邏輯：使用 JOIN 一次查詢取代兩次連續查詢
    * 利用 Supabase 的 JOIN 功能，直接從 cards 表查詢並驗證用戶權限
    */

    let dbQuery = supabase
      .from('cards')
      .select(`
        *,
        lists!inner(user_id)
      `)
      .eq('lists.user_id', user.id)
      .order('position', { ascending: true })

    // 如果指定了 list_id，加上篩選條件
    if (listId) {
      dbQuery = dbQuery.eq('list_id', listId)
    }

    const { data, error } = await dbQuery

    // 處理資料庫錯誤
    if (error) {
      console.error('資料庫查詢錯誤:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得卡片資料失敗'
      })
    }

    console.log(`📊 [API] Cards 查詢結果: 找到 ${data?.length || 0} 個列表`)
    console.log('📋 [API] Cards 列表詳情:', data)

    // 清理回傳資料：移除 JOIN 的额外欄位
    const cleanedData = data?.map(card => {
      const { lists, ...cardData } = card as any
      return cardData
    }) || []

    return cleanedData

  } catch (error) {
    // 如果是我們主動拋出的錯誤（有 statusCode），直接拋出
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // 其他未預期的錯誤
    console.error('未預期的錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})