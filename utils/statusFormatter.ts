/**
 * 狀態格式化工具函數
 * 統一處理 MCP server 回傳的狀態與前端顯示格式的轉換
 */

// MCP server 回傳的狀態類型
type McpStatus = 
  | 'urgent' | 'high' | 'medium' | 'low'
  | 'due-today' | 'due-tomorrow' | 'overdue'
  | 'quick-task' | 'complex-task' | 'research-needed'
  | 'waiting-approval' | 'waiting-others' | 'prerequisites'
  | 'meeting-required' | 'external-dependency'
  | 'one-time' | 'recurring'

// 前端支援的狀態類型
type FrontendStatus = 
  | 'todo' | 'in-progress' | 'done' | 'blocked' | 'review' | 'testing'

// 完整的狀態類型（包含 MCP 和前端狀態）
type StatusType = McpStatus | FrontendStatus | string

/**
 * 將 MCP server 的狀態映射到前端狀態
 * @param mcpStatus MCP server 回傳的狀態
 * @returns 前端對應的狀態
 */
function mapMcpStatusToFrontend(mcpStatus: McpStatus): FrontendStatus {
  const statusMapping: Record<McpStatus, FrontendStatus> = {
    // 優先級相關 -> 待辦
    'urgent': 'todo',
    'high': 'todo', 
    'medium': 'todo',
    'low': 'todo',
    
    // 時間相關 -> 待辦或阻塞
    'due-today': 'todo',
    'due-tomorrow': 'todo',
    'overdue': 'blocked',
    
    // 難度相關 -> 待辦
    'quick-task': 'todo',
    'complex-task': 'todo',
    'research-needed': 'todo',
    
    // 依賴關係 -> 阻塞或審核
    'waiting-approval': 'review',
    'waiting-others': 'blocked',
    'prerequisites': 'blocked',
    
    // 特殊狀態 -> 待辦或審核
    'meeting-required': 'todo',
    'external-dependency': 'blocked',
    'one-time': 'todo',
    'recurring': 'todo'
  }
  
  return statusMapping[mcpStatus] || 'todo'
}

/**
 * 格式化狀態顯示文字
 * 支援 MCP server 狀態和前端狀態的統一格式化
 * @param status 狀態字串
 * @returns 格式化後的中文顯示文字
 */
export function formatStatus(status: StatusType): string {
  // MCP server 狀態的中文映射
  const mcpStatusMap: Record<McpStatus, string> = {
    // 優先級相關
    'urgent': '🔥 緊急',
    'high': '⚡ 高優先',
    'medium': '📋 中優先', 
    'low': '📝 低優先',
    
    // 時間相關
    'due-today': '⏰ 今日到期',
    'due-tomorrow': '📅 明日到期',
    'overdue': '🚨 已逾期',
    
    // 難度相關
    'quick-task': '⚡ 快速任務',
    'complex-task': '🧠 複雜任務',
    'research-needed': '🔍 需研究',
    
    // 依賴關係
    'waiting-approval': '👑 待批准',
    'waiting-others': '👥 等待他人',
    'prerequisites': '📌 有前置條件',
    
    // 特殊狀態
    'meeting-required': '🤝 需會議',
    'external-dependency': '🌐 外部依賴',
    'one-time': '🎯 一次性',
    'recurring': '🔄 重複性'
  }
  
  // 前端狀態的中文映射
  const frontendStatusMap: Record<FrontendStatus, string> = {
    'todo': '待辦',
    'in-progress': '進行中',
    'done': '完成',
    'blocked': '阻塞',
    'review': '審核中',
    'testing': '測試中'
  }
  
  // 首先檢查是否為 MCP 狀態
  if (status in mcpStatusMap) {
    return mcpStatusMap[status as McpStatus]
  }
  
  // 然後檢查是否為前端狀態
  if (status in frontendStatusMap) {
    return frontendStatusMap[status as FrontendStatus]
  }
  
  // 如果都不匹配，返回原始狀態
  return status
}

/**
 * 取得狀態標籤的 CSS 類別
 * @param status 狀態字串
 * @returns CSS 類別字串
 */
export function getStatusTagClass(status: StatusType): string {
  // MCP server 狀態的 CSS 類別映射
  const mcpStatusClasses: Record<McpStatus, string> = {
    // 優先級相關
    'urgent': 'bg-red-600 text-white',
    'high': 'bg-orange-500 text-white',
    'medium': 'bg-yellow-500 text-white',
    'low': 'bg-green-500 text-white',
    
    // 時間相關
    'due-today': 'bg-red-500 text-white',
    'due-tomorrow': 'bg-orange-400 text-white',
    'overdue': 'bg-red-700 text-white',
    
    // 難度相關
    'quick-task': 'bg-blue-400 text-white',
    'complex-task': 'bg-purple-600 text-white',
    'research-needed': 'bg-indigo-500 text-white',
    
    // 依賴關係
    'waiting-approval': 'bg-yellow-600 text-white',
    'waiting-others': 'bg-gray-600 text-white',
    'prerequisites': 'bg-pink-500 text-white',
    
    // 特殊狀態
    'meeting-required': 'bg-teal-500 text-white',
    'external-dependency': 'bg-gray-500 text-white',
    'one-time': 'bg-cyan-500 text-white',
    'recurring': 'bg-lime-500 text-white'
  }
  
  // 前端狀態的 CSS 類別映射
  const frontendStatusClasses: Record<FrontendStatus, string> = {
    'todo': 'bg-gray-500 text-white',
    'in-progress': 'bg-blue-500 text-white',
    'done': 'bg-green-500 text-white',
    'blocked': 'bg-red-500 text-white',
    'review': 'bg-yellow-500 text-white',
    'testing': 'bg-purple-500 text-white'
  }
  
  // 首先檢查是否為 MCP 狀態
  if (status in mcpStatusClasses) {
    return mcpStatusClasses[status as McpStatus]
  }
  
  // 然後檢查是否為前端狀態
  if (status in frontendStatusClasses) {
    return frontendStatusClasses[status as FrontendStatus]
  }
  
  // 預設樣式
  return 'bg-gray-400 text-white'
}

/**
 * 將 MCP 狀態轉換為前端狀態（用於存儲到資料庫）
 * @param status 任何狀態字串
 * @returns 前端狀態
 */
export function normalizeStatusForStorage(status: StatusType): FrontendStatus {
  // 如果已經是前端狀態，直接返回
  if (['todo', 'in-progress', 'done', 'blocked', 'review', 'testing'].includes(status)) {
    return status as FrontendStatus
  }
  
  // 如果是 MCP 狀態，進行映射
  if (status in {
    'urgent': true, 'high': true, 'medium': true, 'low': true,
    'due-today': true, 'due-tomorrow': true, 'overdue': true,
    'quick-task': true, 'complex-task': true, 'research-needed': true,
    'waiting-approval': true, 'waiting-others': true, 'prerequisites': true,
    'meeting-required': true, 'external-dependency': true,
    'one-time': true, 'recurring': true
  }) {
    return mapMcpStatusToFrontend(status as McpStatus)
  }
  
  // 預設為待辦
  return 'todo'
}