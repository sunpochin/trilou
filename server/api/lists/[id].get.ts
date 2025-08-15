// 獲取特定列表的 API 端點
import type { List, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<List>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '列表 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockList: List = {
      id,
      board_id: '1',
      title: `列表 ${id}`,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: mockList,
      success: true,
      message: '成功獲取列表資料'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '獲取列表資料失敗',
      data: { error }
    })
  }
})