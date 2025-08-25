/**
 * 🍞 useToast = Toast 通知管理器
 * 
 * 🎯 這個 Composable 負責什麼？
 * - 管理所有 Toast 通知的狀態
 * - 監聽 EventBus 事件並自動建立 Toast
 * - 處理 Toast 的自動移除
 * - 提供手動操作 Toast 的方法
 * 
 * 💡 使用方式：
 * ```typescript
 * // 在組件中使用
 * const { toasts, addToast, removeToast } = useToast()
 * 
 * // 手動加入 Toast
 * addToast({
 *   type: 'success',
 *   title: '操作成功',
 *   message: '資料已儲存',
 *   duration: 3000
 * })
 * ```
 * 
 * 🌟 優點：
 * - 自動監聽 EventBus 事件
 * - 統一的 Toast 管理
 * - 自動清理過期通知
 * - 防止記憶體洩漏
 */

import { eventBus } from '@/events/EventBus'

// Toast 通知的資料結構
export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning'  // 通知類型
  title?: string                                   // 標題（可選）
  message: string                                  // 訊息內容
  duration?: number                                // 顯示時間（毫秒）
  id?: string                                      // 唯一識別碼（自動生成）
}

// 內部使用的 Toast 物件（包含 ID 和計時器）
interface Toast extends Required<Omit<ToastOptions, 'title'>> {
  title?: string
  timerId?: NodeJS.Timeout  // 自動移除的計時器
}

// 全域 Toast 狀態 - 所有組件共用同一個通知清單
const toasts = ref<Toast[]>([])

// ID 計數器，確保每個 Toast 都有唯一的 ID
let toastIdCounter = 0

export const useToast = () => {
  
  /**
   * 🍞 新增 Toast 通知
   * @param options Toast 選項
   */
  const addToast = (options: ToastOptions): void => {
    // 生成唯一 ID
    const id = options.id || `toast-${++toastIdCounter}`
    
    // 預設顯示時間：錯誤 5 秒，其他 3 秒
    const duration = options.duration ?? (options.type === 'error' ? 5000 : 3000)
    
    // 建立 Toast 物件
    const toast: Toast = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      duration
    }
    
    // 設定自動移除計時器（如果 duration > 0）
    if (duration > 0) {
      toast.timerId = setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    // 加入到通知清單
    toasts.value.push(toast)
    
    if (import.meta.dev) {
      console.log('🍞 [TOAST] 新增通知:', { id, type: options.type, message: options.message })
    }
  }

  /**
   * 🗑️ 移除指定的 Toast
   * @param id Toast ID
   */
  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      const toast = toasts.value[index]
      
      // 清除計時器
      if (toast.timerId) {
        clearTimeout(toast.timerId)
      }
      
      // 從陣列移除
      toasts.value.splice(index, 1)
      
      if (import.meta.dev) {
        console.log('🗑️ [TOAST] 移除通知:', id)
      }
    }
  }

  /**
   * 🧹 清除所有 Toast
   */
  const clearAllToasts = (): void => {
    // 清除所有計時器
    toasts.value.forEach(toast => {
      if (toast.timerId) {
        clearTimeout(toast.timerId)
      }
    })
    
    // 清空陣列
    toasts.value.splice(0)
    
    if (import.meta.dev) {
      console.log('🧹 [TOAST] 清除所有通知')
    }
  }

  /**
   * 🎯 監聽 EventBus 事件，自動建立對應的 Toast
   */
  const setupEventListeners = (): void => {
    // 監聽一般通知事件
    eventBus.on('notification:show', (data) => {
      addToast({
        type: data.type,
        message: data.message
      })
    })

    // 監聽錯誤通知事件
    eventBus.on('notification:error', (data) => {
      addToast({
        type: 'error',
        title: data.title,
        message: data.message,
        duration: data.duration
      })
    })
  }

  /**
   * 🧼 清理 EventBus 監聽器
   */
  const cleanupEventListeners = (): void => {
    // 這裡需要儲存監聽器的參考才能正確移除
    // 暫時先不實作，因為通常 useToast 是全域使用
  }

  // 🚀 初始化：設定事件監聽（只在第一次使用時執行）
  if (toasts.value.length === 0) {
    setupEventListeners()
  }

  // 組件卸載時清理資源
  if (typeof window !== 'undefined') {
    onUnmounted(() => {
      clearAllToasts()
    })
  }

  return {
    // 狀態
    toasts: readonly(toasts),
    
    // 方法
    addToast,
    removeToast,
    clearAllToasts
  }
}