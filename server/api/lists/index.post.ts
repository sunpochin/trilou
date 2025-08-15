// 建立新列表的 API 端點
import type { CreateListRequest, List, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<List>> => {
  try {
    const body = await readBody<CreateListRequest>(event)
    
    // 驗證必要欄位
    if (!body.title || !body.board_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '列表標題和看板 ID 為必填欄位'
      })
    }

    // 驗證 position 是否為有效數字
    if (typeof body.position !== 'number' || body.position < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '位置必須為非負數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const newList: List = {
      id: Date.now().toString(), // 簡單的 ID 生成，之後會用 Supabase 的 UUID
      board_id: body.board_id,
      title: body.title,
      position: body.position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: newList,
      success: true,
      message: '列表建立成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '建立列表失敗',
      data: { error }
    })
  }
})