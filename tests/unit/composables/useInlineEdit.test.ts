/**
 * useInlineEdit Composable 測試
 * 
 * 測試內聯編輯功能，包括：
 * - 基本編輯流程
 * - 資料型別驗證
 * - 事件處理
 * - 錯誤情況處理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useInlineEdit } from '@/composables/useInlineEdit'

describe('useInlineEdit', () => {
  let onSaveMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSaveMock = vi.fn()
  })

  describe('🎯 基本功能測試', () => {
    it('應該正確初始化預設值', () => {
      const { isEditing, editingValue } = useInlineEdit({
        onSave: onSaveMock,
        defaultValue: 'test value'
      })

      expect(isEditing.value).toBe(false)
      expect(editingValue.value).toBe('test value')
    })

    it('應該正確初始化空字串預設值', () => {
      const { isEditing, editingValue } = useInlineEdit({
        onSave: onSaveMock
      })

      expect(isEditing.value).toBe(false)
      expect(editingValue.value).toBe('')
    })

    it('應該能開始編輯', async () => {
      const { isEditing, editingValue, startEdit } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit('initial value')

      expect(isEditing.value).toBe(true)
      expect(editingValue.value).toBe('initial value')
    })

    it('應該能取消編輯', async () => {
      const { isEditing, editingValue, startEdit, cancelEdit } = useInlineEdit({
        onSave: onSaveMock,
        defaultValue: 'default'
      })

      await startEdit('editing value')
      editingValue.value = 'modified'
      
      cancelEdit()

      expect(isEditing.value).toBe(false)
      expect(editingValue.value).toBe('default')
    })
  })

  describe('💾 儲存功能測試', () => {
    it('應該能儲存有效內容', async () => {
      const { editingValue, startEdit, saveEdit } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit()
      editingValue.value = 'new content'
      
      await saveEdit()

      expect(onSaveMock).toHaveBeenCalledWith('new content')
    })

    it('應該忽略空白內容', async () => {
      const { isEditing, editingValue, startEdit, saveEdit } = useInlineEdit({
        onSave: onSaveMock,
        defaultValue: 'default'
      })

      await startEdit()
      editingValue.value = '   '  // 只有空白
      
      await saveEdit()

      expect(onSaveMock).not.toHaveBeenCalled()
      expect(isEditing.value).toBe(false)
      expect(editingValue.value).toBe('default')  // 應該恢復預設值
    })

    it('應該處理儲存錯誤', async () => {
      const error = new Error('Save failed')
      onSaveMock.mockRejectedValue(error)

      const { isEditing, editingValue, startEdit, saveEdit, isSaving } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit()
      editingValue.value = 'content'
      
      await saveEdit()

      // 儲存失敗時應該保持編輯狀態，讓用戶可以重試
      expect(isEditing.value).toBe(true)
      expect(isSaving.value).toBe(false)  // finally 區塊會重置儲存狀態
    })

    it('應該防止重複提交', async () => {
      let resolvePromise: (value: unknown) => void
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      onSaveMock.mockReturnValue(pendingPromise)

      const { editingValue, startEdit, saveEdit, isSaving } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit()
      editingValue.value = 'content'
      
      // 第一次呼叫
      const firstSave = saveEdit()
      expect(isSaving.value).toBe(true)
      
      // 第二次呼叫應該被忽略
      await saveEdit()
      expect(onSaveMock).toHaveBeenCalledTimes(1)

      // 完成第一次呼叫
      resolvePromise!(undefined)
      await firstSave
      expect(isSaving.value).toBe(false)
    })
  })

  describe('🔤 字串處理測試', () => {
    it('editingValue 應該總是字串型別', async () => {
      const { editingValue, startEdit } = useInlineEdit({
        onSave: onSaveMock
      })

      // 測試各種初始值
      await startEdit('')
      expect(typeof editingValue.value).toBe('string')
      expect(editingValue.value).toBe('')

      await startEdit('test')
      expect(typeof editingValue.value).toBe('string')
      expect(editingValue.value).toBe('test')

      // 測試 trim 方法可用
      editingValue.value = '  spaced  '
      expect(editingValue.value.trim()).toBe('spaced')
    })

    it('應該正確處理包含空白的字串', async () => {
      const { editingValue, startEdit, saveEdit } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit()
      editingValue.value = '  valid content  '
      
      await saveEdit()

      expect(onSaveMock).toHaveBeenCalledWith('valid content')
    })
  })

  describe('🎮 Vue Template 整合測試', () => {
    it('disabled 屬性應該正確計算', async () => {
      const { editingValue, startEdit } = useInlineEdit({
        onSave: onSaveMock
      })

      await startEdit()

      // 測試空字串
      editingValue.value = ''
      const isEmpty = !(typeof editingValue.value === 'string' && editingValue.value.trim())
      expect(isEmpty).toBe(true)

      // 測試只有空白
      editingValue.value = '   '
      const isOnlySpaces = !(typeof editingValue.value === 'string' && editingValue.value.trim())
      expect(isOnlySpaces).toBe(true)

      // 測試有效內容
      editingValue.value = 'valid'
      const isValid = !(typeof editingValue.value === 'string' && editingValue.value.trim())
      expect(isValid).toBe(false)
    })
  })

  describe('🚫 邊緣情況測試', () => {
    it('應該處理沒有 onSave 回調的情況', async () => {
      const { editingValue, startEdit, saveEdit } = useInlineEdit({})

      await startEdit()
      editingValue.value = 'content'
      
      // 不應該拋出錯誤
      await expect(saveEdit()).resolves.toBeUndefined()
    })

    it('應該正確處理 autoFocus 選項', async () => {
      const { startEdit } = useInlineEdit({
        onSave: onSaveMock,
        autoFocus: false
      })

      // 不應該拋出錯誤（即使沒有真實的 DOM 元素）
      await expect(startEdit()).resolves.toBeUndefined()
    })
  })
})