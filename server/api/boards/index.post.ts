// 建立新看板的 API 端點
import type { CreateBoardRequest, Board, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Board>> => {
  try {
    const body = await readBody<CreateBoardRequest>(event)
    
    // 驗證必要欄位
    if (!body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: '看板標題為必填欄位'
      })
    }

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const newBoard: Board = {
      id: Date.now().toString(), // 簡單的 ID 生成，之後會用 Supabase 的 UUID
      title: body.title,
      description: body.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return {
      data: newBoard,
      success: true,
      message: '看板建立成功'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: '建立看板失敗',
      data: { error }
    })
  }
})