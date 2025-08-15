// 刪除看板的 API 端點
import type { ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<{ id: string }>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '看板 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 需要確保刪除看板時也刪除相關的列表和卡片

    return {
      data: { id },
      success: true,
      message: '看板刪除成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '刪除看板失敗',
      data: { error }
    })
  }
})