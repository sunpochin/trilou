// 統一的型別定義檔案
// 這個檔案匯出所有項目中使用的核心型別定義，確保型別一致性

// 從 API 型別檔案匯出核心型別
export type { Card, List, Board } from '@/types/api'
export type { 
  CreateCardRequest, 
  CreateListRequest, 
  CreateBoardRequest,
  UpdateCardRequest,
  UpdateListRequest, 
  UpdateBoardRequest,
  ApiResponse,
  ApiError
} from '@/types/api'

// 前端特定的型別定義（與 API 型別略有不同）
export interface CardUI {
  id: string
  title: string
  description?: string
  position?: number
  listId: string                        // UI 採用 camelCase，由 Repository 從 list_id 轉換而來
  // 不包含 API 特有欄位：created_at, updated_at
}

export interface ListUI {
  id: string
  title: string
  position?: number                     // UI 層需要 position 以排序列表
  cards: CardUI[]
  // 不包含 API 特有欄位：user_id, created_at, updated_at
}

export interface BoardUI {
  id: string
  title: string
  description?: string                  // UI 可能需要顯示看板描述
  lists: ListUI[]
  // 不包含 API 特有欄位：created_at, updated_at
}