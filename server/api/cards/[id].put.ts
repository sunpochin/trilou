/**
 * 🎯 更新卡片的 API 端點
 * 
 * 📋 功能說明：
 * - 根據卡片 ID 更新卡片的各種屬性（標題、描述、位置、所屬列表等）
 * - 包含完整的權限驗證：只有卡片所屬列表的擁有者才能更新
 * - 支援跨列表移動：自動驗證目標列表的所有權
 * - 🧪 開發模式支援：當設定 DEV_SKIP_AUTH=true 時，使用固定測試用戶 ID
 * 
 * 🔐 安全機制：
 * - 生產模式：驗證用戶登入狀態
 * - 開發模式：使用固定用戶 ID (a971548d-298f-4513-883f-a6bd370eff1b) 進行測試
 * - 雙重權限檢查：原始列表 + 目標列表（跨列表移動時）
 * - 使用 maybeSingle() 避免查詢錯誤
 * 
 * 🧒 十歲小朋友解釋：
 * - 平常：需要真的鑰匙才能修改你的玩具
 * - 練習時：可以用特殊練習鑰匙來玩
 * - 移動玩具：要確認兩個玩具箱都是你的
 * 
 * 📊 支援更新的欄位：
 * - title: 卡片標題
 * - description: 卡片描述
 * - position: 排序位置
 * - list_id: 所屬列表（可跨列表移動）
 * - due_date: 到期日
 * - status: 卡片狀態（todo/doing/done）
 * - priority: 優先順序（high/medium/low）
 * 
 * 📊 回應格式：
 * - 成功：200 + 更新後的完整卡片資料
 * - 未登入：401 Unauthorized
 * - 無權限：403 Forbidden
 * - 不存在：404 Not Found
 * - 參數錯誤：400 Bad Request
 * - 伺服器錯誤：500 Internal Server Error
 * 
 * 🎮 使用範例：
 * PUT /api/cards/uuid-1234
 * Body: { title: "新標題", position: 2, list_id: "uuid-5678" }
 * → { id, title: "新標題", position: 2, list_id: "uuid-5678", ... }
 */

/**
 * 🃏 這個檔案是「卡片更新 API」
 * 
 * 🧒 十歲小朋友解釋：
 * - 想像你有一張貼紙（卡片），上面寫了一些資訊
 * - 有時候你想要改變貼紙上的內容，比如：
 *   📝 改標題（把「買牛奶」改成「買巧克力牛奶」）
 *   🎨 改狀態（從「計劃中」變成「完成了」）
 *   🔥 改優先順序（從「不急」變成「很重要」）
 * - 這個 API 就像是一個「貼紙修改機器」
 * - 你告訴機器：「請幫我修改第 123 號貼紙」
 * - 機器會先檢查：「這張貼紙是你的嗎？」（安全檢查）
 * - 如果是，就幫你改好並存回資料庫（貼紙收納盒）
 */

// 引入資料庫連接工具
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // 🔌 連接到資料庫
  const supabase = serverSupabaseClient(event)

  // 🏠 決定現在是「練習模式」還是「正式模式」
  let userId: string
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🧪 練習模式：用固定的測試帳號（像玩遊戲時用測試角色）
    userId = process.env.DEV_USER_ID || ""
    console.log('🧪 [練習模式] 更新卡片 - 使用測試帳號:', userId)
  } else {
    // 🔐 正式模式：檢查真正的用戶身份（像進入銀行需要身分證）
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw createError({ statusCode: 401, message: '你沒有登入，不能修改卡片' })
    }
    userId = user.id
    console.log('🔐 [正式模式] 更新卡片 - 使用真實用戶:', userId)
  }

  try {
    // 📋 第一步：取得要修改的卡片編號（從網址中）
    const id = getRouterParam(event, 'id')
    
    // 📦 第二步：取得要修改的內容（從請求中）
    const body = await readBody(event)
    
    // 🔍 印出收到的資料，方便除錯
    console.log('🚀 [API] 有人要修改卡片:')
    console.log('  📋 要修改的卡片編號:', id)
    console.log('  📝 要修改的內容:', JSON.stringify(body, null, 2))
    console.log('  👤 修改者的用戶編號:', userId)
    
    // ✋ 檢查：有沒有告訴我們要修改哪張卡片？
    if (!id) {
      console.log('❌ [API] 錯誤: 沒有告訴我要修改哪張卡片')
      throw createError({
        statusCode: 400,
        message: '你必須告訴我要修改哪張卡片'
      })
    }

    // 🤔 第三步：檢查是不是真的有東西要修改
    // （想像你跟媽媽說「我要改作業」但沒說要改什麼）
    if (!body.title && !body.description && typeof body.position !== 'number' && !body.list_id && !body.due_date && !body.status && !body.priority) {
      throw createError({
        statusCode: 400,
        message: '你至少要告訴我要修改什麼內容'
      })
    }

    // 📏 如果要修改位置（排序），檢查位置是不是合理的數字
    // （不能把卡片放到第 -5 位，那是不存在的位置）
    if (typeof body.position === 'number' && body.position < 0) {
      throw createError({
        statusCode: 400,
        message: '卡片位置不能是負數'
      })
    }

    // 🔐 第四步：檢查這張卡片是不是你的（安全檢查）
    // 就像要確認這本書是你的，才能讓你在上面寫字
    console.log('🔍 正在檢查這張卡片是不是你的...')
    const { data: cardAccess, error: accessError } = await supabase
      .from('cards')
      .select(`
        list_id,
        lists!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('lists.user_id', userId)
      .maybeSingle() // 如果找不到也不要報錯，讓我們自己處理

    // 🚨 如果資料庫查詢本身有問題（像網路斷線）
    if (accessError) {
      console.error('❌ 資料庫查詢出問題:', accessError.message)
      throw createError({
        statusCode: 500,
        message: '無法檢查卡片權限，資料庫可能有問題'
      })
    }

    console.log('📊 檢查結果:', cardAccess)

    // 🚫 如果找不到這張卡片，或這張卡片不是你的
    if (!cardAccess) {
      console.log('❌ 這張卡片不是你的，或者不存在')
      throw createError({
        statusCode: 403,
        message: '你沒有權限修改這張卡片（不是你的）'
      })
    }
    
    console.log('✅ 確認無誤，這張卡片是你的，可以修改')

    // 如果要移動卡片到不同列表，需要驗證目標列表是否也屬於用戶
    if (body.list_id && body.list_id !== cardAccess.list_id) {
      console.log('🔄 [API] 檢測到跨列表移動:')
      console.log('  📤 原始列表 ID:', cardAccess.list_id)
      console.log('  📥 目標列表 ID:', body.list_id)
      
      const { data: targetListAccess } = await supabase
        .from('lists')
        .select('user_id')
        .eq('id', body.list_id)
        .maybeSingle() // ✅ 查無資料時不回傳錯誤

      console.log('📊 [API] 目標列表存取驗證結果:', targetListAccess)

      if (!targetListAccess || targetListAccess.user_id !== userId) {
        console.log('❌ [API] 錯誤: 沒有權限將卡片移動到目標列表')
        throw createError({
          statusCode: 403,
          message: '沒有權限將卡片移動到目標列表'
        })
      }
      
      console.log('✅ [API] 目標列表存取權限驗證通過')
    } else if (body.list_id) {
      console.log('📍 [API] 卡片在同一列表內移動')
    }

    // 準備更新資料
    const updateData: any = {}
    if (body.title) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (typeof body.position === 'number') updateData.position = body.position
    if (body.list_id) updateData.list_id = body.list_id
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.status !== undefined) updateData.status = body.status  // 支援更新 AI 任務狀態
    if (body.priority !== undefined) updateData.priority = body.priority  // 支援更新優先順序

    console.log('📝 [API] 準備更新的資料:', JSON.stringify(updateData, null, 2))

    // 查詢更新前的卡片狀態
    const { data: beforeUpdate } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤
    
    console.log('📊 [API] 更新前的卡片狀態:', beforeUpdate)

    // 更新卡片
    console.log('🔄 [API] 開始執行 Supabase 更新操作...')
    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('❌ [API] Supabase 更新錯誤:')
      console.error('  🔍 錯誤訊息:', error.message)
      console.error('  🔍 錯誤代碼:', error.code)
      console.error('  🔍 錯誤詳情:', error.details)
      console.error('  🔍 錯誤提示:', error.hint)
      throw createError({
        statusCode: 500,
        message: '更新卡片失敗'
      })
    }

    if (!data) {
      console.log('❌ [API] 錯誤: 找不到要更新的卡片')
      throw createError({
        statusCode: 404,
        message: '找不到要更新的卡片'
      })
    }

    console.log('✅ [API] Supabase 更新成功!')
    console.log('📊 [API] 更新後的卡片資料:', JSON.stringify(data, null, 2))
    
    // 驗證更新是否確實生效
    const { data: afterUpdate } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤
    
    console.log('🔍 [API] 驗證更新結果 - 從資料庫重新查詢:', afterUpdate)
    
    if (body.position !== undefined && afterUpdate?.position !== body.position) {
      console.log('⚠️ [API] 警告: position 更新可能未生效')
      console.log('  期望 position:', body.position)
      console.log('  實際 position:', afterUpdate?.position)
    }
    
    if (body.list_id && afterUpdate?.list_id !== body.list_id) {
      console.log('⚠️ [API] 警告: list_id 更新可能未生效')
      console.log('  期望 list_id:', body.list_id)
      console.log('  實際 list_id:', afterUpdate?.list_id)
    }

    return data
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.log('🚨 [API] 已知錯誤被重新拋出:', error)
      throw error
    }
    
    console.error('💥 [API] 未預期的錯誤:')
    console.error('  🔍 錯誤類型:', typeof error)
    console.error('  🔍 錯誤內容:', error)
    console.error('  🔍 錯誤堆疊:', error instanceof Error ? error.stack : '無堆疊資訊')
    
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})