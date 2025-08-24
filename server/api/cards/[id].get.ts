/**
 * 🎯 獲取特定卡片的 API 端點
 * 
 * 📋 功能說明：
 * - 根據卡片 ID 獲取完整的卡片資料
 * - 包含權限驗證：只有卡片所屬列表的擁有者才能存取
 * - 支援關聯查詢：同時獲取所屬列表的基本資訊
 * - 🧪 開發模式支援：當設定 DEV_SKIP_AUTH=true 時，使用固定測試用戶 ID
 * 
 * 🔐 安全機制：
 * - 生產模式：驗證用戶登入狀態
 * - 開發模式：使用固定用戶 ID (a971548d-298f-4513-883f-a6bd370eff1b) 進行測試
 * - 透過 JOIN 查詢確保用戶只能存取自己的卡片
 * - 使用 maybeSingle() 避免查詢錯誤，改用 404 回應
 * 
 * 🧒 十歲小朋友解釋：
 * - 平常：需要真的鑰匙（登入）才能開寶箱
 * - 練習時：可以用特殊練習鑰匙打開寶箱
 * 
 * 📊 回應格式：
 * - 成功：200 + 完整卡片資料（包含 lists 關聯）
 * - 未登入：401 Unauthorized
 * - 無權限/不存在：404 Not Found
 * - 伺服器錯誤：500 Internal Server Error
 * 
 * 🎮 使用範例：
 * GET /api/cards/uuid-1234
 * → { id, title, description, position, list_id, due_date, lists: { id, title, user_id } }
 */

// 獲取特定卡片的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用固定的測試用戶 ID
    userId = "a971548d-298f-4513-883f-a6bd370eff1b"
    console.log('🧪 [DEV-MODE] 使用開發模式固定用戶 ID:', userId)
  } else {
    // 🔐 生產模式：驗證真實用戶身份
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    userId = user.id
    console.log('🔐 [PROD-MODE] 使用真實用戶 ID:', userId)
  }

  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '卡片 ID 為必填參數'
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
      .eq('lists.user_id', userId)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤，交由下方 !data 處理為 404

    if (error) {
      console.error('❌ [API] 資料庫查詢錯誤:', error.message)
      throw createError({
        statusCode: 500,
        message: '獲取卡片資料失敗'
      })
    }

    if (!data) {
      console.log('❌ [API] 找不到指定的卡片或無權限存取')
      throw createError({
        statusCode: 404,
        message: '找不到指定的卡片或您沒有權限存取'
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