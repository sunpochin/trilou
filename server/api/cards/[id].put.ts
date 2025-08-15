// 更新卡片的 API 端點
import type { UpdateCardRequest, Card, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Card>> => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<UpdateCardRequest>(event)
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片 ID 為必填參數'
      })
    }

    // 驗證至少有一個欄位要更新
    if (!body.title && !body.description && typeof body.position !== 'number' && !body.list_id) {
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
    // 當 list_id 改變時，代表卡片要移動到不同的列表
    // 目前返回模擬資料
    const updatedCard: Card = {
      id,
      list_id: body.list_id || '1', // 實際上會從資料庫獲取現有值
      title: body.title || `卡片 ${id}`,
      description: body.description,
      position: body.position ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: updatedCard,
      success: true,
      message: '卡片更新成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '更新卡片失敗',
      data: { error }
    })
  }
})