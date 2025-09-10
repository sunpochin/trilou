/**
 * ✏️ useInlineEdit = 即時編輯小助手 (讓你可以直接點擊修改文字)
 * 
 * 🤔 想像你在寫作業，想要修改錯字：
 * 
 * ❌ 沒有小助手的世界：
 * - 想改個字？要擦掉重寫，很麻煩
 * - 每次修改都要開新的視窗，很慢
 * - 修改一半不想改了？不知道怎麼取消
 * - 忘記保存，修改就不見了
 * 
 * ✅ 有小助手的世界：
 * - 直接點文字就能修改，超方便！
 * - 按 Enter 就存檔，按 Esc 就取消
 * - 小助手會記住原本的內容，取消時自動恢復  
 * - 自動聚焦到輸入框，不用再點一次
 * 
 * 📋 這個小助手有什麼功能？
 * 1. 🖱️ 點擊進入編輯：點一下文字就能修改
 * 2. ⌨️ 鍵盤快捷鍵：Enter 保存，Esc 取消
 * 3. 💾 自動保存：修改完成後自動呼叫保存函數
 * 4. 🔙 安全取消：取消時恢復原本的內容
 * 5. 🎯 聰明聚焦：自動選中輸入框和文字
 * 6. 📝 載入狀態：保存時顯示載入中
 * 
 * 🎯 哪裡會用到這個小助手？
 * - 列表標題編輯 (點列表名字就能改)
 * - 卡片標題編輯 (點卡片名字就能改) 
 * - 新增項目 (點「+ 新增」後直接輸入)
 * 
 * 💡 為什麼需要小助手？
 * - 用戶體驗超棒，感覺很流暢
 * - 統一的編輯行為，不會搞混
 * - 自動處理各種邊緣情況
 * - 一個地方寫好，到處都能用
 * 
 * 🌟 使用範例：
 * ```typescript
 * const titleEdit = useInlineEdit({
 *   onSave: (newTitle) => {
 *     // 保存新標題到伺服器
 *   },
 *   defaultValue: '原本的標題'
 * })
 * 
 * // 在模板中使用
 * <input v-if="titleEdit.isEditing" v-model="titleEdit.editingValue" />
 * <span v-else @click="titleEdit.startEdit">{{ title }}</span>
 * ```
 */

import { ref, nextTick, type Ref } from 'vue'

export interface InlineEditOptions {
  onSave?: (value: string) => void | Promise<void>
  onCancel?: () => void
  defaultValue?: string
  placeholder?: string
  autoFocus?: boolean
}

/**
 * 通用的 inline 編輯邏輯
 * 可用於列表標題編輯、卡片標題編輯、新增卡片等場景
 */
export function useInlineEdit(options: InlineEditOptions = {}) {
  const {
    onSave,
    onCancel,
    defaultValue = '',
    placeholder = '請輸入...',
    autoFocus = true
  } = options

  // 編輯狀態
  const isEditing = ref(false)
  const editingValue = ref(defaultValue)
  const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const isSaving = ref(false)

  /**
   * 開始編輯
   */
  const startEdit = async (initialValue: string = defaultValue) => {
    isEditing.value = true
    editingValue.value = initialValue
    
    if (autoFocus) {
      await nextTick()
      inputRef.value?.focus()
      // 如果是 input 元素，選中全部文字
      if (inputRef.value && 'select' in inputRef.value) {
        inputRef.value.select()
      }
    }
  }

  /**
   * 儲存編輯
   */
  const saveEdit = async () => {
    // 防止重複提交
    if (isSaving.value) return
    
    const valueToSave = editingValue.value.trim()
    if (!valueToSave) {
      cancelEdit()
      return
    }
    
    isSaving.value = true
    
    try {
      // 呼叫外部的儲存邏輯
      if (onSave) {
        await onSave(valueToSave)
      }
      
      // 成功後關閉編輯模式
      isEditing.value = false
      editingValue.value = ''
    } catch (error) {
      console.error('儲存失敗:', error)
      // 失敗時保持編輯狀態，讓用戶可以重試
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 取消編輯
   */
  const cancelEdit = () => {
    isEditing.value = false
    editingValue.value = defaultValue
    
    if (onCancel) {
      onCancel()
    }
  }

  /**
   * 處理按鍵事件
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      saveEdit()
    } else if (event.key === 'Escape') {
      cancelEdit()
    }
  }

  return {
    // 狀態
    isEditing,
    editingValue,
    inputRef,
    isSaving,
    placeholder,
    
    // 方法
    startEdit,
    saveEdit,
    cancelEdit,
    handleKeydown
  }
}

/**
 * 批量管理多個 inline 編輯器
 * 用於同一組件內有多個編輯區域的場景
 */
export function useInlineEditGroup() {
  const editors = new Map<string, ReturnType<typeof useInlineEdit>>()
  
  /**
   * 創建或獲取編輯器
   */
  const getEditor = (key: string, options?: InlineEditOptions) => {
    if (!editors.has(key)) {
      editors.set(key, useInlineEdit(options))
    }
    return editors.get(key)!
  }
  
  /**
   * 關閉所有編輯器
   */
  const closeAll = () => {
    editors.forEach(editor => {
      if (editor.isEditing.value) {
        editor.cancelEdit()
      }
    })
  }
  
  /**
   * 檢查是否有任何編輯器在編輯中
   */
  const hasActiveEditor = () => {
    return Array.from(editors.values()).some(editor => editor.isEditing.value)
  }
  
  return {
    getEditor,
    closeAll,
    hasActiveEditor
  }
}