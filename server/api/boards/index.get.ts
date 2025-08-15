// 獲取所有看板的 API 端點
import type { Board, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Board[]>> => {
  try {
    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockBoards: Board[] = [
      {
        id: '1',
        title: '我的第一個看板',
        description: '這是一個範例看板',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    return {
      data: mockBoards,
      success: true,
      message: '成功獲取看板列表'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '獲取看板列表失敗',
      data: { error }
    })
  }
})