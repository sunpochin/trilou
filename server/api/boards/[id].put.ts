// 更新看板的 API 端點
import type { UpdateBoardRequest, Board, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Board>> => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<UpdateBoardRequest>(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '看板 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && !body.description) {
      throw createError({
        statusCode: 400,
        statusMessage: '至少需要提供一個要更新的欄位'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const updatedBoard: Board = {
      id,
      title: body.title || `看板 ${id}`,
      description: body.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: updatedBoard,
      success: true,
      message: '看板更新成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '更新看板失敗',
      data: { error }
    })
  }
})