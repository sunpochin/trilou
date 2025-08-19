/**
 * 🎭 useConfirmDialog = 確認對話框管理器
 * 
 * 🎯 這個 Composable 負責什麼？
 * - 管理確認對話框的顯示/隱藏狀態
 * - 處理用戶的確認/取消選擇
 * - 提供 Promise 介面，讓調用者可以用 await 等待結果
 * - 支援自訂對話框內容和樣式
 * 
 * 💡 使用方式：
 * ```typescript
 * const { showConfirm } = useConfirmDialog()
 * 
 * try {
 *   const confirmed = await showConfirm({
 *     title: '刪除確認',
 *     message: '確定要刪除這個項目嗎？',
 *     dangerMode: true
 *   })
 *   
 *   if (confirmed) {
 *     // 用戶點擊確認
 *   }
 * } catch (error) {
 *   // 對話框已經開啟時會拋出錯誤
 *   console.log('對話框忙碌中，請稍後再試')
 * }
 * ```
 * 
 * 🌟 優點：
 * - 替換醜陋的 browser confirm()
 * - 統一的視覺風格
 * - 支援鍵盤操作 (ESC/Enter)
 * - Promise 介面易於使用
 * - 防止重複進入，避免 Promise 洩漏
 */

interface ConfirmOptions {
  title?: string          // 對話框標題
  message: string         // 確認訊息  
  confirmText?: string    // 確認按鈕文字
  cancelText?: string     // 取消按鈕文字
  dangerMode?: boolean    // 是否為危險操作
}

interface ConfirmState {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  dangerMode?: boolean
  resolve?: (value: boolean) => void
}

// 全域狀態 - 確保整個應用只有一個對話框實例
const confirmState = ref<ConfirmState>({
  show: false,
  message: ''
})

export const useConfirmDialog = () => {
  
  /**
   * 📋 顯示確認對話框
   * @param options 對話框選項
   * @returns Promise<boolean> - true: 確認, false: 取消
   */
  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    // 🛡️ 防止重複進入：如果對話框已經開啟，拒絕新的請求
    if (confirmState.value.show) {
      if (import.meta.dev) {
        console.warn('⚠️ [CONFIRM] 對話框已開啟，忽略重複顯示')
        console.warn('   📋 當前對話框:', confirmState.value.message)
        console.warn('   🚫 被拒絕的對話框:', options.message)
      }
      return Promise.reject(new Error('Confirm dialog already open'))
    }
    
    if (import.meta.dev) {
      console.log('🎭 [CONFIRM] 顯示確認對話框:', options)
    }
    
    return new Promise((resolve) => {
      // 設定對話框狀態
      confirmState.value = {
        show: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        dangerMode: options.dangerMode,
        resolve
      }
    })
  }

  /**
   * ✅ 處理用戶確認
   */
  const handleConfirm = () => {
    console.log('✅ [CONFIRM] 用戶點擊確認')
    const { resolve } = confirmState.value
    
    // 隱藏對話框
    confirmState.value.show = false
    
    // 回傳確認結果
    if (resolve) {
      resolve(true)
    }
  }

  /**
   * ❌ 處理用戶取消
   */
  const handleCancel = () => {
    console.log('❌ [CONFIRM] 用戶點擊取消')
    const { resolve } = confirmState.value
    
    // 隱藏對話框
    confirmState.value.show = false
    
    // 回傳取消結果
    if (resolve) {
      resolve(false)
    }
  }

  return {
    // 對話框狀態（供組件綁定）
    confirmState: readonly(confirmState),
    
    // 方法
    showConfirm,
    handleConfirm, 
    handleCancel
  }
}