// 取得列表的 API 端點
import { serverSupabaseClient } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  console.log('API called: /api/lists')
  
  try {
    const supabase = serverSupabaseClient(event)
    console.log('Supabase client created')

    // 驗證用戶身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check result:', { user: user?.id, authError })
    
    if (!user) {
      console.log('No user found, returning 401')
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    console.log('Fetching lists for user:', user.id)
 
    // 簡化查詢：直接查詢用戶的列表
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching lists:', error.message)
      throw createError({
        statusCode: 500,
        message: '取得列表失敗'
      })
    }

    console.log('Lists fetched successfully:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('Outer catch error:', error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})
