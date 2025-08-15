// 建立新卡片的 API 端點
import type { CreateCardRequest, Card, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Card>> => {
  try {
    const body = await readBody<CreateCardRequest>(event)
    
    // 驗證必要欄位
    if (!body.title || !body.list_id) {
      throw createError({
        statusCode: 400,
        statusMessage: '卡片標題和列表 ID 為必填欄位'
      })
    }

    // 驗證 position 是否為有效數字
    if (typeof body.position !== 'number' || body.position < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '位置必須為非負數'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const newCard: Card = {
      id: Date.now().toString(), // 簡單的 ID 生成，之後會用 Supabase 的 UUID
      list_id: body.list_id,
      title: body.title,
      description: body.description,
      position: body.position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: newCard,
      success: true,
      message: '卡片建立成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '建立卡片失敗',
      data: { error }
    })
  }
})