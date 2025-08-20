/**
 * 🗑️ 刪除卡片的 API 端點
 * 
 * 🎯 這個 API 負責什麼？
 * - 安全地刪除指定的卡片
 * - 驗證用戶權限（只能刪除自己列表中的卡片）
 * - 從 Supabase 資料庫中永久移除卡片記錄
 * 
 * 🔐 安全機制：
 * 1. 用戶身份驗證
 * 2. 權限檢查（透過 lists 表的 user_id）
 * 3. SQL Injection 防護（參數化查詢）
 * 
 * 📋 處理流程：
 * 1. 驗證用戶登入狀態
 * 2. 檢查卡片 ID 有效性
 * 3. 驗證用戶是否有權限刪除此卡片
 * 4. 執行刪除操作
 * 5. 回傳結果
 */
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // 為查詢結果建立明確的 TypeScript 型別
  type CardWithList = {
    id: string
    title: string
    list_id: string
    lists: {
      id: string
      title: string
      user_id: string
    }
  }

  const supabase = serverSupabaseClient(event)

  // 🔐 步驟1: 驗證用戶身份
  console.log('🔐 [API] 開始驗證用戶身份...')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('❌ [API] 用戶未登入')
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  console.log('✅ [API] 用戶身份驗證通過，用戶 ID:', user.id)

  try {
    const id = getRouterParam(event, 'id')
    
    // 🔍 [API] 記錄收到的請求資料
    console.log('🗑️ [API] DELETE /api/cards/[id] 收到請求:')
    console.log('  📋 卡片 ID:', id)
    console.log('  👤 用戶 ID:', user.id)
    
    if (!id) {
      console.log('❌ [API] 錯誤: 卡片 ID 為空')
      throw createError({
        statusCode: 400,
        message: '卡片 ID 為必填參數'
      })
    }

    // 🔐 步驟2: 查詢卡片並驗證權限
    console.log('🔍 [API] 查詢卡片資訊並驗證權限...')
    const { data: cardInfo, error: queryError } = await supabase
      .from('cards')
      .select(`
        id,
        title,
        list_id,
        lists!inner (
          id,
          title,
          user_id
        )
      `)
      .eq('id', id)
      .eq('lists.user_id', user.id)
      .maybeSingle<CardWithList>() // ✅ 查無資料時不回傳錯誤，交由下方 !cardInfo 處理為 404

    // 處理真正的查詢錯誤（如資料庫連線問題、SQL 語法錯誤等）
    if (queryError) {
      console.error('❌ [API] 資料庫查詢錯誤:', queryError.message)
      throw createError({
        statusCode: 500,
        message: '查詢卡片失敗'
      })
    }

    // 處理業務邏輯錯誤：找不到卡片或無權限存取
    if (!cardInfo) {
      console.log('❌ [API] 錯誤: 找不到要刪除的卡片或無權限刪除')
      throw createError({
        statusCode: 404,
        message: '找不到要刪除的卡片或無權限刪除'
      })
    }

    // ✅ 現在 cardInfo.lists 有了明確的型別，不再需要 as any
    console.log('📊 [API] 找到要刪除的卡片:', {
      id: cardInfo.id,
      title: cardInfo.title,
      listId: cardInfo.list_id,
      listTitle: cardInfo.lists.title,
      listOwner: cardInfo.lists.user_id
    })

    // 🗑️ 步驟3: 執行刪除操作
    console.log('🔄 [API] 開始執行 Supabase 刪除操作...')
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ [API] Supabase 刪除錯誤:')
      console.error('  🔍 錯誤訊息:', error.message)
      console.error('  🔍 錯誤代碼:', error.code)
      console.error('  🔍 錯誤詳情:', error.details)
      console.error('  🔍 錯誤提示:', error.hint)
      throw createError({
        statusCode: 500,
        message: '刪除卡片失敗'
      })
    }

    console.log('✅ [API] Supabase 刪除操作成功!')
    console.log('🎉 [API] 卡片刪除流程完成!')
    console.log('📋 [API] 已刪除卡片:', cardInfo.title)
    console.log('📁 [API] 所屬列表:', cardInfo.lists.title)

    return { 
      id,
      message: '卡片已成功刪除',
      deletedCard: {
        id: cardInfo.id,
        title: cardInfo.title,
        listTitle: cardInfo.lists.title
      }
    }
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
