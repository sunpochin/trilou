// 獲取特定看板的 API 端點
import type { Board, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Board>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '看板 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockBoard: Board = {
      id,
      title: `看板 ${id}`,
      description: '這是一個範例看板描述',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: mockBoard,
      success: true,
      message: '成功獲取看板資料'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '獲取看板資料失敗',
      data: { error }
    })
  }
})