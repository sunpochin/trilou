/**
 * 📄 獲取單一列表 API - GET /api/lists/[id]
 * 
 * ======================== 與 index.get.ts 的差別 ========================
 * 
 * 📄 [id].get.ts (這個檔案)：
 * - 路徑：GET /api/lists/123 (需要特定 ID)
 * - 功能：獲取「單一列表」的詳細資料
 * - 回傳：單一列表物件 {id, title, position, created_at, ...}
 * - 使用時機：需要特定列表的完整資訊
 * 
 * 📋 index.get.ts (另一個檔案)：
 * - 路徑：GET /api/lists (沒有 ID)
 * - 功能：獲取用戶的「所有列表」
 * - 回傳：列表陣列 [{id, title, position}, {id, title, position}, ...]
 * - 使用時機：初次載入看板，需要顯示所有列表
 * 
 * ======================== 十歲小朋友解釋 ========================
 * 
 * 想像你有很多玩具箱：
 * 
 * 📦 [id].get.ts = 「看某個玩具箱的詳細內容」
 * - 媽媽問：樂高箱裡面有什麼？
 * - 你回答：有10個人偶、3台車、2棟房子...（一個箱子的詳細內容）
 * 
 * 📦 index.get.ts = 「看所有玩具箱的名單」
 * - 媽媽問：家裡有哪些玩具箱？
 * - 你回答：樂高箱、積木箱、汽車箱...（所有箱子的清單）
 * 
 * ======================== 實際範例 ========================
 * 
 * GET /api/lists/1 → 回傳：
 * {
 *   id: "1",
 *   title: "待辦事項",
 *   position: 0,
 *   created_at: "2024-01-01",
 *   updated_at: "2024-01-02",
 *   user_id: "abc123"
 * }
 * 
 * GET /api/lists → 回傳：
 * [
 *   { id: "1", title: "待辦事項", position: 0 },
 *   { id: "2", title: "進行中", position: 1 },
 *   { id: "3", title: "已完成", position: 2 }
 * ]
 * 
 * ======================== 為什麼要分開？ ========================
 * 
 * 1. 效能考量：有時只需要列表清單，不需要每個列表的完整資料
 * 2. 權限控制：可以分別控制「看所有列表」和「看特定列表」的權限
 * 3. 使用場景：看板載入 vs 編輯特定列表
 */

// 獲取特定列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用環境變數定義的測試用戶 ID
    userId = process.env.DEV_USER_ID || ""
    console.log('🧪 [DEV-MODE] 獲取列表 - 使用開發模式固定用戶 ID:', userId)
  } else {
    // 🔐 生產模式：驗證真實用戶身份
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    userId = user.id
  }

  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: '列表 ID 為必填參數'
      })
    }

    // 簡化查詢：直接查詢用戶的列表
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('Error fetching list:', error.message)
      throw createError({
        statusCode: 500,
        message: '獲取列表資料失敗'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        message: '找不到指定的列表或您沒有權限存取'
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