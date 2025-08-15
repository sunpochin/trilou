// 獲取特定卡片的 API 端點
import type { Card, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Card>> => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片 ID 為必填參數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockCard: Card = {
      id,
      list_id: '1',
      title: `卡片 ${id}`,
      description: '這是一個範例卡片描述',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: mockCard,
      success: true,
      message: '成功獲取卡片資料'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '獲取卡片資料失敗',
      data: { error }
    })
  }
})