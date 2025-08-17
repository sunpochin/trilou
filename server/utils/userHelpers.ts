// 用戶相關的工具函數
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 確保用戶存在於 users 表中，如果不存在則嘗試建立
 * @param supabase Supabase 客戶端  
 * @param user 來自 Auth 的用戶物件
 */
export async function ensureUserExists(supabase: SupabaseClient, user: any) {
  console.log('🔍 [USER_HELPER] 檢查用戶是否存在:', user.id)
  
  // 檢查用戶是否已存在於 users 表中
  const { data: existingUser, error: userCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()  // 使用 maybeSingle 而不是 single，這樣找不到記錄時不會報錯

  console.log('📋 [USER_HELPER] 用戶檢查結果:', { 
    existingUser, 
    userCheckError: userCheckError?.message, 
    code: userCheckError?.code 
  })

  // 如果找到了用戶，直接返回
  if (existingUser) {
    console.log('✅ [USER_HELPER] 用戶已存在')
    return
  }

  // 如果有查詢錯誤（非用戶不存在）
  if (userCheckError) {
    console.error('❌ [USER_HELPER] 查詢用戶時發生錯誤：', userCheckError.message)
    throw createError({
      statusCode: 500,
      message: '檢查用戶狀態失敗'
    })
  }

  // 如果用戶不存在，嘗試建立
  if (!existingUser) {
    console.log('👤 [USER_HELPER] 用戶不存在，嘗試建立用戶記錄...')
    
    // 使用 upsert 來避免重複問題
    const { error: createUserError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'Unknown User',
        avatar_url: user.user_metadata?.avatar_url || null
      }, {
        onConflict: 'id'  // 如果 ID 衝突就更新
      })

    if (createUserError) {
      console.error('❌ [USER_HELPER] 建立用戶失敗:', createUserError)
      
      // 如果是 RLS 問題，提供更詳細的錯誤訊息
      if (createUserError.message.includes('row-level security')) {
        throw createError({
          statusCode: 500,
          message: '資料庫權限設定問題：請在 Supabase 中設定 users 表的 RLS 政策，允許已認證用戶建立自己的記錄'
        })
      }
      
      throw createError({
        statusCode: 500,
        message: `建立用戶記錄失敗: ${createUserError.message}`
      })
    }
    
    console.log('✅ [USER_HELPER] 用戶記錄建立/更新成功')
  }
}