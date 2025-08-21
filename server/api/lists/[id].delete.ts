// 刪除列表的 API 端點
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
    
    // 🔍 [API] 記錄收到的請求資料
    console.log('🗑️ [API] DELETE /api/lists/[id] 收到請求:')
    console.log('  📋 列表 ID:', id)
    console.log('  👤 用戶 ID:', user.id)
    
    if (!id) {
      console.log('❌ [API] 錯誤: 列表 ID 為空')
      throw createError({
        statusCode: 400,
        message: '列表 ID 為必填參數'
      })
    }

    // 查詢刪除前的列表資訊（用於記錄和驗證）
    console.log('🔍 [API] 查詢要刪除的列表資訊...')
    const { data: existingList, error: queryError } = await supabase
      .from('lists')
      .select('id, title, user_id, cards(count)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (queryError) {
      console.error('❌ [API] 查詢列表錯誤:', queryError.message)
      throw createError({
        statusCode: 500,
        message: '查詢列表失敗'
      })
    }

    if (!existingList) {
      console.log('❌ [API] 錯誤: 找不到要刪除的列表或無權限刪除')
      throw createError({
        statusCode: 404,
        message: '找不到要刪除的列表或無權限刪除'
      })
    }

    console.log('📊 [API] 找到要刪除的列表:', {
      id: existingList.id,
      title: existingList.title,
      cardsCount: existingList.cards?.[0]?.count || 0
    })

    // 🧸 步驟1: 先把玩具箱裡的所有玩具清空（刪除所有卡片）
    console.log('🧸 [API] 步驟1: 先清空玩具箱（刪除列表中的所有卡片）...')
    const { error: cardsDeleteError } = await supabase
      .from('cards')
      .delete()
      .eq('list_id', id)

    if (cardsDeleteError) {
      console.error('❌ [API] 刪除卡片錯誤:')
      console.error('  🔍 錯誤訊息:', cardsDeleteError.message)
      console.error('  🔍 錯誤代碼:', cardsDeleteError.code)
      console.error('  🔍 錯誤詳情:', cardsDeleteError.details)
      throw createError({
        statusCode: 500,
        message: '清空列表卡片失敗'
      })
    }

    console.log('✅ [API] 步驟1完成: 玩具箱已清空（所有卡片已刪除）')

    // 📦 步驟2: 現在可以安全地丟掉空的玩具箱（刪除列表）
    console.log('📦 [API] 步驟2: 丟掉空的玩具箱（刪除列表）...')
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('❌ [API] 刪除列表錯誤:')
      console.error('  🔍 錯誤訊息:', error.message)
      console.error('  🔍 錯誤代碼:', error.code)
      console.error('  🔍 錯誤詳情:', error.details)
      console.error('  🔍 錯誤提示:', error.hint)
      throw createError({
        statusCode: 500,
        message: '刪除列表失敗'
      })
    }

    console.log('✅ [API] 步驟2完成: 玩具箱已丟掉（列表刪除成功）!')
    console.log('🎉 [API] 整個刪除流程完成!')
    console.log('📋 [API] 已刪除列表:', existingList.title)
    console.log('🧸 [API] 該列表的所有卡片也已經清空')

    return { 
      id,
      message: '列表已成功刪除',
      deletedList: {
        id: existingList.id,
        title: existingList.title
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