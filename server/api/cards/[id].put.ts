// 更新卡片的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    // 🔍 [DEBUG] 記錄收到的請求資料
    console.log('🚀 [API] PUT /api/cards/[id] 收到請求:')
    console.log('  📋 卡片 ID:', id)
    console.log('  📝 請求 body:', JSON.stringify(body, null, 2))
    console.log('  👤 用戶 ID:', user.id)
    
    if (!id) {
      console.log('❌ [API] 錯誤: 卡片 ID 為空')
      throw createError({
        statusCode: 400,
        message: '卡片 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && !body.description && typeof body.position !== 'number' && !body.list_id && !body.due_date) {
      throw createError({
        statusCode: 400,
        message: '至少需要提供一個要更新的欄位'
      })
    }

    // 如果有提供 position，驗證是否為有效數字
    if (typeof body.position === 'number' && body.position < 0) {
      throw createError({
        statusCode: 400,
        message: '位置必須為非負數'
      })
    }

    // 首先驗證用戶是否有權限編輯此卡片（檢查卡片所屬的列表是否屬於用戶）
    console.log('🔐 [API] 驗證卡片存取權限...')
    const { data: cardAccess, error: accessError } = await supabase
      .from('cards')
      .select(`
        list_id,
        lists!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('lists.user_id', user.id)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤，交由下方 !cardAccess 處理為 403

    // 處理真正的查詢錯誤（如資料庫連線問題、SQL 語法錯誤等）
    if (accessError) {
      console.error('❌ [API] 資料庫查詢錯誤:', accessError.message)
      throw createError({
        statusCode: 500,
        message: '查詢卡片權限失敗'
      })
    }

    console.log('📊 [API] 卡片存取驗證結果:', cardAccess)

    if (!cardAccess) {
      console.log('❌ [API] 錯誤: 沒有權限編輯此卡片')
      throw createError({
        statusCode: 403,
        message: '沒有權限編輯此卡片'
      })
    }
    
    console.log('✅ [API] 卡片存取權限驗證通過')

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

      if (!targetListAccess || targetListAccess.user_id !== user.id) {
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