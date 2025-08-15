// 獲取卡片的 API 端點（可依列表 ID 篩選）
import type { Card, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<Card[]>> => {
  try {
    const query = getQuery(event)
    const listId = query.list_id as string

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockCards: Card[] = [
      {
        id: '1',
        list_id: listId || '1',
        title: '設計使用者介面',
        description: '建立 Trello 克隆的使用者介面設計',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        list_id: listId || '1',
        title: '實作拖拉功能',
        description: '讓使用者可以拖拉卡片到不同列表',
        position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        list_id: listId || '2',
        title: '建立 API 端點',
        description: '建立後端 API 來處理 CRUD 操作',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // 如果有指定列表 ID，則只返回該列表的卡片
    const filteredCards = listId 
      ? mockCards.filter(card => card.list_id === listId)
      : mockCards

    return {
      data: filteredCards,
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