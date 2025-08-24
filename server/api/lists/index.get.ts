/**
 * 🗂️ 獲取所有列表 API - GET /api/lists
 * 
 * ======================== 與 [id].get.ts 的差別 ========================
 * 
 * 📋 index.get.ts (這個檔案)：
 * - 路徑：GET /api/lists (沒有 ID)
 * - 功能：獲取用戶的「所有列表」
 * - 回傳：列表陣列 [{id, title, position}, {id, title, position}, ...]
 * - 使用時機：初次載入看板，需要顯示所有列表
 * 
 * 📄 [id].get.ts (另一個檔案)：
 * - 路徑：GET /api/lists/123 (有特定 ID)
 * - 功能：獲取「單一列表」的詳細資料
 * - 回傳：單一列表物件 {id, title, position, created_at, ...}
 * - 使用時機：需要特定列表的完整資訊
 * 
 * ======================== 十歲小朋友解釋 ========================
 * 
 * 想像你有很多玩具箱：
 * 
 * 📦 index.get.ts = 「看所有玩具箱的名單」
 * - 媽媽問：家裡有哪些玩具箱？
 * - 你回答：樂高箱、積木箱、汽車箱...（所有箱子的清單）
 * 
 * 📦 [id].get.ts = 「看某個玩具箱的詳細內容」
 * - 媽媽問：樂高箱裡面有什麼？
 * - 你回答：有10個人偶、3台車、2棟房子...（一個箱子的詳細內容）
 * 
 * ======================== 實際範例 ========================
 * 
 * GET /api/lists → 回傳：
 * [
 *   { id: "1", title: "待辦事項", position: 0 },
 *   { id: "2", title: "進行中", position: 1 },
 *   { id: "3", title: "已完成", position: 2 }
 * ]
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
 */

// 取得列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseClient(event)

    // 🧪 開發模式：允許跳過認證使用固定測試用戶
    let userId: string
    const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
    
    if (skipAuth) {
      // 🎯 開發模式：使用環境變數定義的測試用戶 ID
      userId = process.env.DEV_USER_ID || ""
      console.log('🧪 [DEV-MODE] 獲取列表清單 - 使用開發模式固定用戶 ID:', userId)
    } else {
      // 🔐 生產模式：驗證真實用戶身份
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
      }
      
      userId = user.id
    }

    console.log(`🔍 [LISTS-API] 查詢用戶 ${userId} 的列表`)
    
    // 查詢用戶的列表，按 position 排序
    const { data, error } = await supabase
      .from('lists')
      .select('id, title, position')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) {
      console.error('❌ [LISTS-API] Error fetching lists:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得列表失敗'
      })
    }

    console.log(`📊 [LISTS-API] 查詢結果: 找到 ${data?.length || 0} 個列表`)
    console.log('📋 [LISTS-API] 列表詳情:', data)
    
    return data || []
  } catch (error) {
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})