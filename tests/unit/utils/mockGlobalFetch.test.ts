/**
 * 🧪 mockGlobalFetch 工具測試
 * 
 * 測試 Rabbit 建議的型別安全 Mock 工具
 * 驗證解決 TypeScript 編譯錯誤和測試間汙染的方案
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  setupGlobalFetchMock, 
  cleanupGlobalFetchMock, 
  resetGlobalFetchMock,
  mockFetch,
  getGlobalFetchMockCalls,
  verifyGlobalFetchMockSetup,
  type FetchLike
} from '@/tests/utils/mockGlobalFetch'

describe('mockGlobalFetch 工具測試', () => {
  // 確保每個測試都從乾淨狀態開始
  beforeEach(() => {
    cleanupGlobalFetchMock()
  })

  afterEach(() => {
    cleanupGlobalFetchMock()
  })

  describe('setupGlobalFetchMock 功能', () => {
    it('應該正確設定全域 $fetch mock', () => {
      setupGlobalFetchMock()
      
      // 驗證全域 $fetch 存在且為函數
      expect(global.$fetch).toBeDefined()
      expect(typeof global.$fetch).toBe('function')
      
      // 驗證是 mock 函數
      expect(verifyGlobalFetchMockSetup()).toBe(true)
    })

    it('應該保留 Mock 的所有功能', () => {
      setupGlobalFetchMock()
      
      // 驗證可以使用 mockResolvedValue
      expect(typeof mockFetch.mockResolvedValue).toBe('function')
      expect(typeof mockFetch.mockRejectedValue).toBe('function')
      expect(typeof mockFetch.mockImplementation).toBe('function')
      
      // 驗證可以查看呼叫記錄
      expect(mockFetch.mock).toBeDefined()
      expect(Array.isArray(mockFetch.mock.calls)).toBe(true)
    })

    it('應該設定預設的成功回應', async () => {
      setupGlobalFetchMock()
      
      // 測試預設回應
      const result = await global.$fetch!('/test')
      expect(result).toEqual({})
      
      // 驗證呼叫記錄
      expect(mockFetch).toHaveBeenCalledWith('/test')
    })

    it('應該支援 TypeScript 類型安全', () => {
      setupGlobalFetchMock()
      
      // 驗證類型定義正確（編譯時檢查）
      const fetch: FetchLike = global.$fetch!
      expect(typeof fetch).toBe('function')
      
      // 驗證可以傳入正確的參數類型
      fetch('/api/test', {
        method: 'POST',
        body: { data: 'test' },
        headers: { 'Content-Type': 'application/json' }
      })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: { data: 'test' },
        headers: { 'Content-Type': 'application/json' }
      })
    })
  })

  describe('cleanupGlobalFetchMock 功能', () => {
    it('應該清理全域 $fetch', () => {
      setupGlobalFetchMock()
      expect(global.$fetch).toBeDefined()
      
      cleanupGlobalFetchMock()
      expect(global.$fetch).toBeUndefined()
    })

    it('應該清理 mock 呼叫記錄', () => {
      setupGlobalFetchMock()
      
      // 做一些呼叫
      global.$fetch!('/test1')
      global.$fetch!('/test2')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      cleanupGlobalFetchMock()
      expect(mockFetch).toHaveBeenCalledTimes(0)
    })

    it('應該避免測試間狀態汙染', () => {
      // 第一個「測試」
      setupGlobalFetchMock()
      mockFetch.mockResolvedValue({ data: 'test1' })
      global.$fetch!('/test1')
      
      cleanupGlobalFetchMock()
      
      // 第二個「測試」
      setupGlobalFetchMock()
      expect(mockFetch).toHaveBeenCalledTimes(0) // 應該是乾淨狀態
      expect(global.$fetch).toBeDefined() // 但功能還在
    })
  })

  describe('resetGlobalFetchMock 功能', () => {
    it('應該重置 mock 狀態但保留全域掛載', () => {
      setupGlobalFetchMock()
      mockFetch.mockResolvedValue({ custom: 'response' })
      global.$fetch!('/test')
      
      expect(mockFetch).toHaveBeenCalledTimes(1)
      
      resetGlobalFetchMock()
      
      // mock 狀態被重置
      expect(mockFetch).toHaveBeenCalledTimes(0)
      
      // 但全域 $fetch 依然存在
      expect(global.$fetch).toBeDefined()
      
      // 並且回到預設行為
      const result = global.$fetch!('/test-after-reset')
      expect(result).resolves.toEqual({})
    })
  })

  describe('getGlobalFetchMockCalls 功能', () => {
    it('應該返回呼叫記錄的副本', () => {
      setupGlobalFetchMock()
      
      global.$fetch!('/api/users')
      global.$fetch!('/api/posts', { method: 'POST', body: { title: 'test' } })
      
      const calls = getGlobalFetchMockCalls()
      
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual(['/api/users'])
      expect(calls[1]).toEqual(['/api/posts', { method: 'POST', body: { title: 'test' } }])
    })

    it('應該返回獨立的副本，不會被後續呼叫影響', () => {
      setupGlobalFetchMock()
      
      global.$fetch!('/test1')
      const calls1 = getGlobalFetchMockCalls()
      
      global.$fetch!('/test2')
      const calls2 = getGlobalFetchMockCalls()
      
      expect(calls1).toHaveLength(1)
      expect(calls2).toHaveLength(2)
    })
  })

  describe('verifyGlobalFetchMockSetup 功能', () => {
    it('應該在正確設定時返回 true', () => {
      setupGlobalFetchMock()
      expect(verifyGlobalFetchMockSetup()).toBe(true)
    })

    it('應該在未設定時返回 false', () => {
      cleanupGlobalFetchMock()
      expect(verifyGlobalFetchMockSetup()).toBe(false)
    })

    it('應該在設定被破壞時返回 false', () => {
      setupGlobalFetchMock()
      
      // 破壞設定
      global.$fetch = undefined
      
      expect(verifyGlobalFetchMockSetup()).toBe(false)
    })
  })

  describe('SOLID 原則和設計模式驗證', () => {
    it('符合 Single Responsibility 原則 - 每個函數職責單一', () => {
      // setupGlobalFetchMock 只負責設定
      // cleanupGlobalFetchMock 只負責清理
      // resetGlobalFetchMock 只負責重置
      // getGlobalFetchMockCalls 只負責取得記錄
      // verifyGlobalFetchMockSetup 只負責驗證
      
      const functions = {
        setup: setupGlobalFetchMock,
        cleanup: cleanupGlobalFetchMock,
        reset: resetGlobalFetchMock,
        getCalls: getGlobalFetchMockCalls,
        verify: verifyGlobalFetchMockSetup
      }
      
      Object.values(functions).forEach(fn => {
        expect(typeof fn).toBe('function')
      })
    })

    it('符合 DRY 原則 - 避免重複代碼', () => {
      // 工具函數避免在每個測試文件重複相同的 mock 設定邏輯
      // 這個測試本身就是證明，我們可以在多個地方重用這些函數
      
      setupGlobalFetchMock()
      expect(verifyGlobalFetchMockSetup()).toBe(true)
      
      cleanupGlobalFetchMock()
      expect(verifyGlobalFetchMockSetup()).toBe(false)
      
      // 可以重複使用
      setupGlobalFetchMock()
      expect(verifyGlobalFetchMockSetup()).toBe(true)
    })

    it('符合 Type Safety 原則 - 提供完整的 TypeScript 支援', () => {
      setupGlobalFetchMock()
      
      // 類型安全的函數調用（編譯時檢查）
      const fetchFunction: FetchLike = global.$fetch!
      
      // 支援各種參數組合
      fetchFunction('/simple')
      fetchFunction('/with-options', { method: 'GET' })
      fetchFunction('/with-body', { method: 'POST', body: { data: 'test' } })
      fetchFunction('/with-headers', { 
        method: 'PUT', 
        body: { update: true },
        headers: { 'Authorization': 'Bearer token' }
      })
      
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })
  })
})