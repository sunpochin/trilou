/**
 * 🎯 建立新卡片的 API 端點
 * 
 * 📋 功能說明：
 * - 在指定列表中建立新的卡片
 * - 包含完整的權限驗證：只有列表擁有者才能在該列表建立卡片
 * - 自動計算卡片位置：如果未指定 position，會放在列表最後
 * - 🧪 開發模式支援：當設定 DEV_SKIP_AUTH=true 時，使用固定測試用戶 ID
 * - 支援 AI 生成任務：可以設定 status 標籤來標記 AI 生成的卡片
 * 
 * 🔐 安全機制：
 * - 生產模式：驗證用戶登入狀態並確保用戶存在於 users 表
 * - 開發模式：使用固定用戶 ID (a971548d-298f-4513-883f-a6bd370eff1b) 進行測試
 * - 權限檢查：確認目標列表屬於當前用戶
 * - 使用 maybeSingle() 避免查詢錯誤
 * 
 * 🧒 十歲小朋友解釋：
 * - 平常：需要真的鑰匙才能在你的玩具箱裡放新玩具
 * - 練習時：可以用特殊練習鑰匙來練習放玩具
 * - 只能在自己的玩具箱放玩具，不能放到別人的
 * 
 * 📊 必填欄位：
 * - title: 卡片標題
 * - list_id: 目標列表 ID
 * 
 * 📊 可選欄位：
 * - description: 卡片描述
 * - position: 排序位置（不提供則自動計算）
 * - status: AI 任務狀態標籤
 * 
 * 📊 回應格式：
 * - 成功：200 + 新建立的完整卡片資料
 * - 未登入：401 Unauthorized
 * - 無權限：403 Forbidden
 * - 參數錯誤：400 Bad Request
 * - 伺服器錯誤：500 Internal Server Error
 * 
 * 🎮 使用範例：
 * POST /api/cards
 * Body: { title: "新卡片", list_id: "uuid-1234", description: "卡片描述" }
 * → { id, title: "新卡片", list_id: "uuid-1234", position: 3, ... }
 */

// 建立新卡片的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'
import { ensureUserExists } from '@/server/utils/userHelpers'
import { CardStatus } from '@/types/api'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  let user: any = null
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用固定的測試用戶 ID
    userId = process.env.DEV_USER_ID || ""
    // 創建假的 user 物件供 ensureUserExists 使用
    user = {
      id: userId,
      email: 'dev-user@test.com',
      user_metadata: {
        name: 'Development User'
      }
    }
    console.log('🧪 [DEV-MODE] 建立卡片 - 使用開發模式固定用戶 ID:', userId)
  } else {
    // 🔐 生產模式：驗證真實用戶身份
    const { data: { user: realUser } } = await supabase.auth.getUser()
    if (!realUser) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    user = realUser
    userId = realUser.id
    console.log('🔐 [PROD-MODE] 建立卡片 - 使用真實用戶 ID:', userId)
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
    if (!listAccessResult.data || listAccessResult.data.user_id !== userId) {
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
        status: body.status || CardStatus.TODO,        // 預設狀態為 'todo'
        priority: body.priority || 'medium',   // 預設優先級為 'medium'
        moved_at: new Date().toISOString(),    // 初始移動時間
        started_at: (body.status === CardStatus.DOING) ? new Date().toISOString() : null,
        completed_at: (body.status === CardStatus.DONE) ? new Date().toISOString() : null
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