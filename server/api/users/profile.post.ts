// 建立用戶個人資料的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event)

  // 驗證用戶身份
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  try {
    const body = await readBody(event)
    
    // 建立或更新用戶記錄，使用 upsert 避免重複建立
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: body.name || user.user_metadata?.name || user.email || 'Unknown User',
        avatar_url: body.avatar_url || user.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (error) {
      console.error('建立用戶資料失敗:', error.message)
      
      if (error.message.includes('row-level security')) {
        throw createError({
          statusCode: 500,
          message: '資料庫權限設定問題，需要管理員協助設定 users 表的 RLS 政策'
        })
      }
      
      throw createError({
        statusCode: 500,
        message: '建立用戶資料失敗'
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