// 刪除卡片的 API 端點
import type { ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<{ id: string }>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 刪除卡片相對簡單，只需要刪除該卡片記錄即可

    return {
      data: { id },
      success: true,
      message: '卡片刪除成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '刪除卡片失敗',
      data: { error }
    })
  }
})