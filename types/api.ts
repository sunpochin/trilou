// API 請求和回應的型別定義
export interface Board {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  board_id: string
  title: string
  position: number
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  list_id: string
  title: string
  description?: string
  position: number
  created_at: string
  updated_at: string
}

// 建立請求的型別（不含 id, created_at, updated_at）
export interface CreateBoardRequest {
  title: string
  description?: string
}

export interface CreateListRequest {
  board_id: string
  title: string
  position: number
}

export interface CreateCardRequest {
  list_id: string
  title: string
  description?: string
  position: number
}

// 更新請求的型別（所有欄位都是可選的）
export interface UpdateBoardRequest {
  title?: string
  description?: string
}

export interface UpdateListRequest {
  title?: string
  position?: number
}

export interface UpdateCardRequest {
  title?: string
  description?: string
  position?: number
  list_id?: string // 允許移動卡片到不同列表
}

// API 回應的型別
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface ApiError {
  success: false
  message: string
  error?: any
}