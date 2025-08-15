// 獲取列表的 API 端點（可依看板 ID 篩選）
import type { List, ApiResponse } from '@/types/api'

export default defineEventHandler(async (event): Promise<ApiResponse<List[]>> => {
  try {
    const query = getQuery(event)
    const boardId = query.board_id as string

    // TODO: 這裡之後會串接 Supabase
    // 目前返回模擬資料
    const mockLists: List[] = [
      {
        id: '1',
        board_id: boardId || '1',
        title: '待辦事項',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        board_id: boardId || '1',
        title: '進行中',
        position: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        board_id: boardId || '1',
        title: '已完成',
        position: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // 如果有指定看板 ID，則只返回該看板的列表
    const filteredLists = boardId 
      ? mockLists.filter(list => list.board_id === boardId)
      : mockLists

    return {
      data: filteredLists,
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