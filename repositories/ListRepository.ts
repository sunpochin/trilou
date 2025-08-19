/**
 * 📋 List Repository - 列表資料存取層
 * 
 * 🎯 職責：
 * - 處理列表相關的 API 呼叫
 * - 轉換 API 格式為前端格式
 * - 統一錯誤處理
 */

import type { ListUI } from '@/types'

// 使用統一的列表型別定義
type List = ListUI

/**
 * 📋 ListRepository 類別
 * 
 * 🤔 為什麼要有 ListRepository？
 * - 統一列表資料的存取邏輯
 * - 轉換 API 格式 (position, user_id) → UI 格式 (position)
 * - 集中錯誤處理
 * - 方便測試和維護
 */
export class ListRepository {
  
  /**
   * 📊 取得所有列表
   * 
   * 🤔 這個函數做什麼？
   * - 呼叫 API 取得所有列表
   * - 轉換格式並排序
   * - 回傳乾淨的 ListUI 陣列
   * 
   * 💡 為什麼要排序？
   * - 確保列表按照 position 正確排列
   * - 統一處理排序邏輯
   * 
   * 🔧 回傳值：
   * @returns Promise<List[]> - 排序後的列表陣列
   */
  async getAllLists(): Promise<List[]> {
    try {
      console.log('🚀 [LIST-REPO] 開始取得所有列表')
      
      const response = await $fetch('/api/lists')
      console.log(`📊 [LIST-REPO] 成功取得 ${response.length} 個列表`)
      
      // 轉換並排序
      const lists = this.transformApiLists(response)
      console.log('✅ [LIST-REPO] 列表轉換完成')
      
      return lists
      
    } catch (error) {
      throw this.handleError(error, '取得列表失敗')
    }
  }

  /**
   * 🆕 建立新列表
   * 
   * 🤔 這個函數做什麼？
   * - 呼叫 API 建立新列表
   * - 轉換回傳的列表格式
   * 
   * 🔧 參數說明：
   * @param title - 列表標題
   * @returns Promise<List> - 新建立的列表
   */
  async createList(title: string): Promise<List> {
    try {
      console.log(`🚀 [LIST-REPO] 開始建立列表: ${title}`)
      
      const response = await $fetch('/api/lists', {
        method: 'POST',
        body: { title }
      })
      
      const newList = this.transformApiList(response)
      console.log('✅ [LIST-REPO] 列表建立完成')
      
      return newList
      
    } catch (error) {
      throw this.handleError(error, '建立列表失敗')
    }
  }

  /**
   * 🗑️ 刪除列表
   * 
   * 🔧 參數說明：
   * @param listId - 要刪除的列表 ID
   * @returns Promise<void> - 不回傳資料
   */
  async deleteList(listId: string): Promise<void> {
    try {
      console.log(`🚀 [LIST-REPO] 開始刪除列表: ${listId}`)
      
      await $fetch(`/api/lists/${listId}`, {
        method: 'DELETE'
      })
      
      console.log('✅ [LIST-REPO] 列表刪除完成')
      
    } catch (error) {
      throw this.handleError(error, '刪除列表失敗')
    }
  }

  /**
   * 🔄 轉換單個列表格式
   * 
   * @param apiList - API 回傳的列表資料
   * @returns List - 前端格式的列表資料
   */
  private transformApiList(apiList: any): List {
    if (!apiList || typeof apiList !== 'object') {
      throw new Error('無效的 API 列表資料')
    }

    return {
      id: apiList.id,
      title: apiList.title,
      position: apiList.position,
      cards: []  // 空的卡片陣列，會由其他地方填入
    }
  }

  /**
   * 🔄 轉換多個列表格式
   * 
   * @param apiLists - API 回傳的列表陣列
   * @returns List[] - 前端格式的列表陣列
   */
  private transformApiLists(apiLists: any[]): List[] {
    if (!Array.isArray(apiLists)) {
      console.warn('⚠️ [LIST-REPO] API 回應不是陣列，回傳空陣列')
      return []
    }

    return apiLists
      .map(list => this.transformApiList(list))
      .sort((a, b) => (a.position || 0) - (b.position || 0))  // 按位置排序
  }

  /**
   * 🚨 錯誤處理統一函數
   * 
   * @param error - 原始錯誤
   * @param context - 錯誤發生的情境
   * @returns Error - 包裝後的錯誤
   */
  private handleError(error: any, context: string): Error {
    console.error(`❌ [LIST-REPO] ${context}:`, error)
    
    // 保留原始錯誤訊息，但加上情境
    const message = error?.message || error?.toString() || '未知錯誤'
    return new Error(`${context}: ${message}`)
  }
}

// 匯出單例實例，供整個應用程式使用
export const listRepository = new ListRepository()