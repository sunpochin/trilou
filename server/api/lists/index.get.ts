// 取得列表的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseClient(event)

    // 驗證用戶身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
 
    // 簡化查詢：直接查詢用戶的列表
    console.log(`🔍 [API] 查詢用戶 ${user.id} 的列表`)
    
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('❌ [API] Error fetching lists:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得列表失敗'
      })
    }

    // console.log(`📊 [API] 查詢結果: 找到 ${data?.length || 0} 個列表`)
    // console.log('📋 [API] 列表詳情:', data)
    
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
