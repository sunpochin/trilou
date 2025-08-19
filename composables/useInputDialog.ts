/**
 * 🎭 useInputDialog = 輸入對話框管理器
 * 
 * 🎯 這個 Composable 負責什麼？
 * - 管理輸入對話框的顯示/隱藏狀態
 * - 處理用戶的輸入和確認/取消選擇
 * - 提供 Promise 介面，讓調用者可以用 await 等待結果
 * - 支援自訂對話框內容和輸入驗證
 * 
 * 💡 使用方式：
 * ```typescript
 * const { showInput } = useInputDialog()
 * 
 * const userInput = await showInput({
 *   title: '新增項目',
 *   message: '請輸入項目名稱',
 *   placeholder: '項目名稱...'
 * })
 * 
 * if (userInput) {
 *   // 用戶輸入了內容並確認
 * }
 * ```
 * 
 * 🌟 優點：
 * - 替換醜陋的 browser prompt()
 * - 統一的視覺風格
 * - 支援鍵盤操作 (ESC/Enter)
 * - Promise 介面易於使用
 * - 自動聚焦和選取文字
 */

interface InputOptions {
  title?: string          // 對話框標題
  message?: string        // 說明訊息
  placeholder?: string    // 輸入框佔位符
  confirmText?: string    // 確認按鈕文字
  cancelText?: string     // 取消按鈕文字
  initialValue?: string   // 初始值
}

interface InputState {
  show: boolean
  title?: string
  message?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  initialValue?: string
  resolve?: (value: string | null) => void
}

// 全域狀態 - 確保整個應用只有一個對話框實例
const inputState = ref<InputState>({
  show: false
})

export const useInputDialog = () => {
  
  /**
   * 📋 顯示輸入對話框
   * @param options 對話框選項
   * @returns Promise<string | null> - 用戶輸入的值，取消時返回 null
   */
  const showInput = (options: InputOptions): Promise<string | null> => {
    console.log('🎭 [INPUT] 顯示輸入對話框:', options)
    
    return new Promise((resolve) => {
      // 設定對話框狀態
      inputState.value = {
        show: true,
        title: options.title,
        message: options.message,
        placeholder: options.placeholder,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        initialValue: options.initialValue,
        resolve
      }
    })
  }

  /**
   * ✅ 處理用戶確認
   */
  const handleConfirm = (value: string) => {
    console.log('✅ [INPUT] 用戶點擊確認，輸入值:', value)
    const { resolve } = inputState.value
    
    // 隱藏對話框
    inputState.value.show = false
    
    // 回傳輸入值
    if (resolve) {
      resolve(value)
    }
  }

  /**
   * ❌ 處理用戶取消
   */
  const handleCancel = () => {
    console.log('❌ [INPUT] 用戶點擊取消')
    const { resolve } = inputState.value
    
    // 隱藏對話框
    inputState.value.show = false
    
    // 回傳 null
    if (resolve) {
      resolve(null)
    }
  }

  return {
    // 對話框狀態（供組件綁定）
    inputState: readonly(inputState),
    
    // 方法
    showInput,
    handleConfirm, 
    handleCancel
  }
}