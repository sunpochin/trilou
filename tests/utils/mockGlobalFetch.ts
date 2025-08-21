/**
 * 🛠️ 全域 $fetch Mock 工具
 * 
 * 🎯 符合 Rabbit 建議的型別安全 Mock 設定
 * 解決 TypeScript 編譯錯誤和測試間狀態汙染問題
 * 
 * 💡 使用方式：
 * ```typescript
 * import { setupGlobalFetchMock, cleanupGlobalFetchMock, mockFetch } from '@/tests/utils/mockGlobalFetch'
 * 
 * beforeEach(() => {
 *   setupGlobalFetchMock()
 *   mockFetch.mockResolvedValue({ data: 'test' })
 * })
 * 
 * afterEach(() => {
 *   cleanupGlobalFetchMock()
 * })
 * ```
 * 
 * 🎯 符合的設計原則：
 * - Single Responsibility: 專門處理全域 fetch mock
 * - DRY: 避免在每個測試文件重複相同邏輯
 * - Type Safety: 提供完整的 TypeScript 類型支援
 */

import { vi, type Mock } from 'vitest'

// 🛡️ 測試環境中的全域 $fetch 型別宣告
export type FetchLike = (input: string, init?: { 
  method?: string
  body?: any
  headers?: Record<string, string>
}) => Promise<any>

// 🌐 全域類型宣告（只在測試環境生效）
declare global {
  // eslint-disable-next-line no-var
  var $fetch: FetchLike | undefined
}

// 🎭 創建 mock 實例
export const mockFetch = vi.fn() as Mock<Parameters<FetchLike>, ReturnType<FetchLike>>

/**
 * 🚀 設定型別安全的全域 $fetch mock
 * 在每個測試的 beforeEach 中調用
 */
export function setupGlobalFetchMock(): void {
  // 以型別安全方式掛載至全域，並保留 Mock 的所有方法
  global.$fetch = mockFetch as unknown as FetchLike
  
  // 設定預設的成功回應
  mockFetch.mockResolvedValue({})
}

/**
 * 🧹 清理全域狀態，避免測試間汙染
 * 在每個測試的 afterEach 中調用
 */
export function cleanupGlobalFetchMock(): void {
  // 清理全域狀態
  delete global.$fetch
  
  // 清理 mock 狀態
  mockFetch.mockClear()
}

/**
 * 🔄 重置 mock 狀態但保留全域掛載
 * 在測試過程中需要重置 mock 時使用
 */
export function resetGlobalFetchMock(): void {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({})
}

/**
 * 📋 取得當前 mock 的呼叫記錄
 * 用於測試驗證
 */
export function getGlobalFetchMockCalls(): ReturnType<Mock['mock']['calls']['slice']> {
  return mockFetch.mock.calls.slice()
}

/**
 * ✅ 驗證 mock 設定是否正確
 * 用於除錯測試設定問題
 */
export function verifyGlobalFetchMockSetup(): boolean {
  return (
    global.$fetch === mockFetch &&
    typeof global.$fetch === 'function' &&
    typeof mockFetch.mockResolvedValue === 'function'
  )
}