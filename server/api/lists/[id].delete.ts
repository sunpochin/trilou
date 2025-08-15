// 刪除列表的 API 端點
import type { ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<{ id: string }>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '列表 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 需要確保刪除列表時也刪除相關的卡片

    return {
      data: { id },
      success: true,
      message: '列表刪除成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '刪除列表失敗',
      data: { error }
    })
  }
})