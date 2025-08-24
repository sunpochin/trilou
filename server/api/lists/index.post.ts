// 建立新列表的 API 端點
import { serverSupabaseClient } from '@/server/utils/supabase'
import { ensureUserExists } from '@/server/utils/userHelpers'

export default defineEventHandler(async (event) => {
  console.log('🚀 [LISTS POST] API 被呼叫')
  
  const supabase = serverSupabaseClient(event)

  // 🧪 開發模式：允許跳過認證使用固定測試用戶
  let userId: string
  let user: any = null
  const skipAuth = process.env.DEV_SKIP_AUTH === 'true'
  
  if (skipAuth) {
    // 🎯 開發模式：使用環境變數定義的測試用戶 ID
    userId = process.env.DEV_USER_ID || ""
    // 創建假的 user 物件供 ensureUserExists 使用
    user = {
      id: userId,
      email: 'dev-user@test.com',
      user_metadata: {
        name: 'Development User'
      }
    }
    console.log('🧪 [DEV-MODE] 建立列表 - 使用開發模式固定用戶 ID:', userId)
  } else {
    // 🔐 生產模式：驗證真實用戶身份
    const { data: { user: realUser }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 [LISTS POST] Auth 結果:', { user: realUser?.id, authError: authError?.message })
    
    if (!realUser) {
      console.log('❌ [LISTS POST] 用戶未認證')
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }
    user = realUser
    userId = realUser.id
  }

  try {
    const body = await readBody(event)
    console.log('📝 [LISTS POST] Request body:', body)
    
    // 驗證必要欄位
    if (!body.title) {
      console.log('❌ [LISTS POST] 缺少列表標題')
      throw createError({
        statusCode: 400,
        message: '列表標題為必填欄位'
      })
    }

    console.log('👤 [LISTS POST] 檢查用戶是否存在...')
    // 確保用戶存在於 users 表中（如果不存在則建立）
    await ensureUserExists(supabase, user)
    console.log('✅ [LISTS POST] 用戶檢查完成')

    // 如果沒有提供 position，自動設定為最後一個位置
    let position = body.position
    console.log('📊 [LISTS POST] Position 處理:', { providedPosition: body.position, typeCheck: typeof position })
    
    if (typeof position !== 'number') {
      console.log('🔢 [LISTS POST] 計算新的 position...')
      // 取得該用戶最大的 position 值
      const { data: lastList, error: positionError } = await supabase
        .from('lists')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle() // ✅ 查無資料時不回傳錯誤
      
      console.log('📈 [LISTS POST] Position 查詢結果:', { lastList, positionError: positionError?.message })
      position = lastList ? lastList.position + 1 : 0
      console.log('📌 [LISTS POST] 最終 position:', position)
    }

    // console.log('💾 [LISTS POST] 準備插入資料:', {
    //   title: body.title,
    //   user_id: user.id,
    //   position: position
    // })

    // 建立新列表
    const { data, error } = await supabase
      .from('lists')
      .insert({
        title: body.title,
        user_id: userId,
        position: position
      })
      .select()
      .maybeSingle() // ✅ 查無資料時不回傳錯誤

    if (error) {
      console.error('❌ [LISTS POST] Supabase 插入錯誤:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw createError({
        statusCode: 500,
        message: '建立列表失敗'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 500,
        message: '建立列表失敗：無法取得新列表資料'
      })
    }

    console.log('✅ [LISTS POST] 列表建立成功:', data)
    return data
  } catch (error) {
    console.error('💥 [LISTS POST] Catch 區塊捕獲錯誤:', error)
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      console.log('🔄 [LISTS POST] 重新拋出已知錯誤:', error)
      throw error
    }
    
    console.error('❌ [LISTS POST] 未預期錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '伺服器內部錯誤'
    })
  }
})