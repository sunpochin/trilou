// 更新列表的 API 端點
import type { UpdateListRequest, List, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<List>> => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<UpdateListRequest>(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '列表 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && typeof body.position !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: '至少需要提供一個要更新的欄位'
      })
    }

    // 如果有提供 position，驗證是否為有效數字
    if (typeof body.position === 'number' && body.position < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '位置必須為非負數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const updatedList: List = {
      id,
      board_id: '1', // 實際上會從資料庫獲取
      title: body.title || `列表 ${id}`,
      position: body.position ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: updatedList,
      success: true,
      message: '列表更新成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '更新列表失敗',
      data: { error }
    })
  }
})