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
    const query = getQuery(event)
    const listId = query.list_id as string

    /*
    * 新的簡化查詢邏輯：
    * 
    * schema 變簡單了：lists 直接屬於 user，不需要 boards 和 board_members
    * 步驟 1：找出用戶的所有列表 ID
    * 步驟 2：查詢這些列表下的卡片
    */

    // 步驟 1：找出用戶的列表
    let listQuery = supabase
      .from('lists')
      .select('id')
      .eq('user_id', user.id)

    // 如果有指定 list_id，直接使用該 ID（但仍需驗證是用戶的列表）
    if (listId) {
      listQuery = listQuery.eq('id', listId)
    }

    const { data: userLists, error: listError } = await listQuery

    if (listError) {
      console.error('查詢用戶列表失敗:', listError.message)
      throw createError({
        statusCode: 500,
        message: '查詢用戶列表失敗'
      })
    }

    const listIds = userLists?.map(item => item.id) || []

    // 如果沒有找到任何列表，回傳空陣列
    if (listIds.length === 0) {
      return []
    }

    // 步驟 2：查詢這些列表下的卡片（簡單查詢）
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('list_id', listIds)
      .order('position', { ascending: true })

    // 處理資料庫錯誤
    if (error) {
      console.error('資料庫查詢錯誤:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得卡片資料失敗'
      })
    }

    // 回傳結果：如果沒有資料就回傳空陣列
    return data || []

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