// 統一的型別定義檔案
// 這個檔案匯出所有項目中使用的核心型別定義，確保型別一致性

// 從 API 型別檔案匯出核心型別
export type { Card, List, Board } from './api'
export type { 
  CreateCardRequest, 
  CreateListRequest, 
  CreateBoardRequest,
  UpdateCardRequest,
  UpdateListRequest, 
  UpdateBoardRequest,
  ApiResponse,
  ApiError
} from './api'

// 前端特定的型別定義（與 API 型別略有不同）
export interface CardUI {
  id: string
  title: string
  description?: string
  position?: number
  // 不包含 API 特有的欄位如 list_id, created_at, updated_at
}

export interface ListUI {
  id: string
  title: string
  cards: CardUI[]
  // 不包含 API 特有的欄位如 user_id, position, created_at, updated_at
}

export interface BoardUI {
  id: string
  title: string
  lists: ListUI[]
  // 不包含 API 特有的欄位如 description, created_at, updated_at
}