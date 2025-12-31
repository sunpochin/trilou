// API 請求和回應的型別定義

/**
 * 看板實體型別定義
 * 代表一個 Trello 看板的完整資料結構
 */
export interface Board {
  id: string           // 看板唯一識別碼
  title: string        // 看板標題
  description?: string // 看板描述（可選）
  created_at: string   // 建立時間（ISO 格式）
  updated_at: string   // 最後更新時間（ISO 格式）
}

/**
 * 卡片狀態列舉型別
 * 定義卡片在工作流程中的三個階段
 */
export enum CardStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done'
}

/**
 * 卡片優先順序列舉型別
 * 定義卡片的重要程度等級
 */
export enum CardPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * 列表實體型別定義
 * 代表看板中的一個列表（欄位），包含多張卡片
 */
export interface List {
  id: string         // 列表唯一識別碼
  title: string      // 列表標題
  position: number   // 列表在看板中的排序位置
  user_id: string    // 擁有此列表的使用者 ID
  created_at: string // 建立時間（ISO 格式）
  updated_at: string // 最後更新時間（ISO 格式）
}

/**
 * 卡片實體型別定義
 * 代表列表中的一張工作卡片
 */
export interface Card {
  id: string           // 卡片唯一識別碼
  list_id: string      // 所屬列表的 ID
  title: string        // 卡片標題
  description?: string // 卡片詳細描述（可選）
  position: number     // 卡片在列表中的排序位置
  status: CardStatus   // 卡片狀態：待辦、進行中或已完成
  priority: CardPriority // 卡片優先順序：高、中或低
  created_at: string   // 建立時間（ISO 格式）
  updated_at: string   // 最後更新時間（ISO 格式）
  completed_at?: string // 完成時間（ISO 格式）
  started_at?: string   // 開始執行時間（ISO 格式）
  moved_at?: string     // 最後移動時間（ISO 格式）
}

/**
 * ===================
 * 建立實體請求型別定義
 * ===================
 * 用於 POST API 請求的資料結構
 * 不包含系統自動生成的欄位（id, created_at, updated_at）
 */

/**
 * 建立看板請求型別
 * 用於新建一個看板時傳送的資料
 */
export interface CreateBoardRequest {
  title: string        // 看板標題（必填）
  description?: string // 看板描述（可選）
}

/**
 * 建立列表請求型別
 * 用於在看板中新增列表時傳送的資料
 */
export interface CreateListRequest {
  title: string      // 列表標題（必填）
  position?: number  // 列表位置（可選，後端會自動計算）
}

/**
 * 建立卡片請求型別
 * 用於在列表中新增卡片時傳送的資料
 */
export interface CreateCardRequest {
  list_id: string      // 目標列表 ID（必填）
  title: string        // 卡片標題（必填）
  description?: string // 卡片描述（可選）
  position: number     // 卡片在列表中的位置（必填）
  status?: CardStatus  // 卡片初始狀態（可選，預設為 'todo'）
  priority?: CardPriority // 卡片初始優先順序（可選，預設為 'medium'）
}

/**
 * ===================
 * 更新實體請求型別定義
 * ===================
 * 用於 PUT/PATCH API 請求的資料結構
 * 所有欄位都是可選的，只傳送需要更新的欄位
 */

/**
 * 更新看板請求型別
 * 用於修改現有看板資訊時傳送的資料
 */
export interface UpdateBoardRequest {
  title?: string       // 新的看板標題（可選）
  description?: string // 新的看板描述（可選）
}

/**
 * 更新列表請求型別
 * 用於修改現有列表資訊或調整位置時傳送的資料
 */
export interface UpdateListRequest {
  title?: string    // 新的列表標題（可選）
  position?: number // 新的列表位置（可選）
}

/**
 * 更新卡片請求型別
 * 用於修改卡片資訊、移動卡片或改變狀態時傳送的資料
 */
export interface UpdateCardRequest {
  title?: string       // 新的卡片標題（可選）
  description?: string // 新的卡片描述（可選）
  position?: number    // 新的卡片位置（可選）
  list_id?: string     // 新的所屬列表 ID（可選，用於跨列表移動）
  status?: CardStatus  // 新的卡片狀態（可選）
  priority?: CardPriority // 新的卡片優先順序（可選）
  completed_at?: string   // 完成時間（可選，通常由後端自動更新）
  started_at?: string     // 開始執行時間（可選，通常由後端自動更新）
  moved_at?: string       // 最後移動時間（可選，通常由後端自動更新）
}

/**
 * ===================
 * API 回應型別定義
 * ===================
 * 定義後端 API 統一的回應格式
 */

/**
 * 成功回應的通用型別
 * 使用泛型 T 來表示不同 API 回傳的資料型別
 * 
 * @template T 實際資料的型別（如 Board、List、Card 等）
 */
export interface ApiResponse<T> {
  data: T              // 實際回傳的資料
  success: boolean     // 請求是否成功
  message?: string     // 可選的訊息說明
}

/**
 * 錯誤回應型別
 * 用於 API 請求失敗時的統一錯誤格式
 */
export interface ApiError {
  success: false       // 固定為 false 表示失敗
  message: string      // 錯誤訊息描述
  error?: any          // 可選的詳細錯誤資訊
}