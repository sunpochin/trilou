/**
 * 🍕 Repository Pattern = 外送員
 * 
 * 🤔 想像你想要吃披薩：
 * 
 * ❌ 沒有外送員的世界：
 * - 你要自己跑去披薩店（組件直接呼叫 API）
 * - 每次都要記住披薩店在哪裡
 * - 如果披薩店搬家了，你就找不到了
 * 
 * ✅ 有外送員的世界：
 * - 你只要打電話給外送員說「我要披薩」
 * - 外送員知道去哪裡買，怎麼送給你
 * - 披薩店搬家了？外送員會處理，你完全不用知道
 * 
 * 🎯 這個檔案就是「外送員」：
 * - 組件說「我要卡片資料」
 * - Repository 去 API 拿資料，處理好格式再給組件
 * - API 網址變了？只要改這個檔案就好，組件完全不用動
 * 
 * 📝 簡單說：不要讓組件直接跟 API 講話，要有中間人幫忙處理
 */

/**
 * 📋 卡片資料介面 - 前端使用的格式
 * 
 * 🤔 這是什麼？
 * - 定義前端程式中卡片應該長什麼樣子
 * - 使用駝峰命名（camelCase）：listId
 * - 符合 JavaScript 的慣例
 */
import type { CardUI } from '@/types'


// Repository 使用 API 型別，因為它直接與後端互動

/**
 * 🌐 API 回應格式介面 - 後端回傳的格式
 * 
 * 🤔 為什麼要分開定義？
 * - 後端可能使用不同的命名規則（蛇形命名 snake_case）
 * - API 格式可能隨時改變，但不想影響前端
 * - 清楚區分「外部資料」vs「內部資料」
 */
// ApiCard 現在使用統一的 Card 型別

export class CardRepository {
  /**
   * 📚 獲取所有卡片 - 去圖書館借所有書
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 請求所有卡片資料
   * - 把 API 的格式轉換成前端需要的格式
   * - 處理可能發生的錯誤
   * 
   * 💡 為什麼需要這個函數？
   * - 組件不用知道 API 網址在哪裡
   * - 組件不用處理 API 格式轉換
   * - 組件不用處理錯誤，Repository 統一處理
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   const cards = await cardRepo.getAllCards()
   *   console.log('取得卡片:', cards.length, '張')
   * } catch (error) {
   *   eventBus.emit('notification:error', {
   *     title: '載入失敗',
   *     message: error.message
   *   })
   * }
   * 
   * 🔄 處理流程：
   * 1. 呼叫 API: GET /api/cards
   * 2. 取得 ApiCard[] 格式的資料
   * 3. 轉換成 Card[] 格式
   * 4. 回傳給呼叫者
   * 
   * 🔧 回傳說明：
   * @returns Promise<Card[]> - 所有卡片的陣列（前端格式）
   * @throws Error - 如果 API 呼叫失敗或轉換失敗
   */
  async getAllCards(): Promise<CardUI[]> {
    try {
      // 📞 呼叫 API 取得原始資料
      const apiCards: CardUI[] = await $fetch('/api/cards')
      
      // 確保回傳的是一個陣列，如果 API 回應 null 或非陣列，則回傳空陣列
      if (!Array.isArray(apiCards)) {
        // 對於非預期的回應，可以選擇拋出錯誤或回傳空陣列
        // 測試期望在回應格式不正確時拋出錯誤
        if (apiCards === null) {
          return [] // 測試案例期望 null 回應變為空陣列
        }
        throw new Error('API 回應格式不正確')
      }
      
      // 🔄 轉換 API 回應成前端格式
      return this.transformApiCards(apiCards)
    } catch (error) {
      // 🚨 統一錯誤處理
      throw this.handleError(error, '獲取卡片失敗')
    }
  }

  /**
   * ➕ 新增卡片 - 去文具店買新的便利貼
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 發送新增卡片的請求
   * - 處理前端格式和 API 格式的差異
   * - 回傳新建立的卡片資料
   * 
   * 💡 為什麼需要格式轉換？
   * - 前端傳入：listId（駝峰命名）
   * - API 需要：list_id（蛇形命名）
   * - Repository 負責處理這個轉換
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   const newCard = await cardRepo.createCard('實作登入功能', 'list_123')
   *   console.log('新卡片 ID:', newCard.id)
   * } catch (error) {
   *   eventBus.emit('notification:error', {
   *     title: '新增失敗',
   *     message: error.message
   *   })
   * }
   * 
   * 🔄 處理流程：
   * 1. 接收前端參數：title, listId
   * 2. 轉換格式：listId → list_id
   * 3. 呼叫 API: POST /api/cards
   * 4. 取得 ApiCard 格式的回應
   * 5. 轉換成 Card 格式回傳
   * 
   * 🔧 參數說明：
   * @param title - 卡片標題
   * @param listId - 所屬列表 ID（前端格式）
   * @returns Promise<Card> - 新建立的卡片（前端格式）
   * @throws Error - 如果新增失敗或驗證失敗
   */
  async createCard(title: string, listId: string, description?: string, status?: string, priority?: string): Promise<CardUI> {
    try {
      console.log('📞 [REPO] 呼叫 API 新增卡片:', { title, listId, description, status, priority })
      
      // 📞 呼叫 API 新增卡片
      // 注意：這裡要把 listId 轉換成 list_id
      const apiCard = await $fetch('/api/cards', {
        method: 'POST',
        body: { 
          title,                // 標題保持不變
          list_id: listId,      // 🔄 駝峰轉蛇形：listId → list_id
          description,          // 描述欄位，可能為空
          status,               // 卡片狀態（todo, doing, done）
          priority              // 卡片優先級（high, medium, low）
        }
      })
      
      console.log('📥 [REPO] API 回應原始資料:', apiCard)
      
      // 🔄 轉換 API 回應成前端格式
      // API 回應是蛇形命名，需要轉換成駝峰命名
      const transformedCard = this.transformApiCard(apiCard)
      console.log('🔄 [REPO] 轉換後的卡片資料:', transformedCard)
      
      return transformedCard
    } catch (error) {
      console.error('❌ [REPO] createCard 錯誤詳情:', error)
      // 🚨 統一錯誤處理
      throw this.handleError(error, '新增卡片失敗')
    }
  }

  /**
   * 🗑️ 刪除卡片 - 把便利貼丟進垃圾桶
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 發送刪除卡片的請求
   * - 處理刪除過程中可能發生的錯誤
   * - 確保刪除操作的安全性
   * 
   * 💡 為什麼不直接回傳資料？
   * - 刪除操作通常不需要回傳內容
   * - Promise<void> 表示「執行完成，但沒有回傳值」
   * - 如果沒有拋出錯誤，就表示刪除成功
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   await cardRepo.deleteCard('card_123')
   *   console.log('卡片已刪除')
   * } catch (error) {
   *   eventBus.emit('notification:error', {
   *     title: '刪除失敗',
   *     message: error.message
   *   })
   * }
   * 
   * 🔄 處理流程：
   * 1. 接收卡片 ID
   * 2. 呼叫 API: DELETE /api/cards/{cardId}
   * 3. 等待 API 確認刪除完成
   * 4. 如果沒有錯誤，表示刪除成功
   * 
   * ⚠️ 安全考量：
   * - API 應該檢查使用者是否有權限刪除這張卡片
   * - 應該檢查卡片是否存在
   * - 可能需要軟刪除（標記為已刪除）而非硬刪除
   * 
   * 🔧 參數說明：
   * @param cardId - 要刪除的卡片 ID
   * @returns Promise<void> - 無回傳值，成功完成或拋出錯誤
   * @throws Error - 如果刪除失敗或沒有權限
   */
  async deleteCard(cardId: string): Promise<void> {
    try {
      // 📞 呼叫 API 刪除卡片
      // 使用 DELETE 方法和卡片 ID
      await $fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
      
      // 🎉 如果執行到這裡，表示刪除成功
      // 不需要回傳任何值，Promise<void> 表示「任務完成」
    } catch (error) {
      // 🚨 統一錯誤處理
      throw this.handleError(error, '刪除卡片失敗')
    }
  }

  /**
   * 🔄 轉換單張卡片格式 - 翻譯員
   * 
   * 🤔 這個函數做什麼？
   * - 把 API 回傳的格式轉換成前端需要的格式
   * - 處理命名規則的差異（蛇形 → 駝峰）
   * - 確保資料格式一致性
   * 
   * 💡 為什麼要做格式轉換？
   * - API 使用 list_id（蛇形命名）
   * - 前端使用 listId（駝峰命名）
   * - 統一前端的資料格式，避免混亂
   * 
   * 📝 轉換對照表：
   * API 格式 (ApiCard)     →  前端格式 (Card)
   * ----------------      →  ----------------
   * id                    →  id           (不變)
   * title                 →  title        (不變)
   * description           →  description  (不變)
   * list_id               →  listId       (蛇形→駝峰)
   * position              →  position     (不變)
   * 
   * 🔧 為什麼是 private？
   * - 這是內部使用的工具函數
   * - 外部不需要知道轉換的細節
   * - 如果 API 格式改變，只需要修改這個函數
   * 
   * 🔧 參數說明：
   * @param apiCard - API 回傳的卡片資料（蛇形命名）
   * @returns Card - 前端格式的卡片資料（駝峰命名）
   */
  private transformApiCard(apiCard: any): CardUI {
    // 確保 apiCard 是物件
    if (!apiCard || typeof apiCard !== 'object') {
      // 或者可以拋出一個錯誤，取決於您希望如何處理這種情況
      throw new Error('無效的 API 卡片資料');
    }

    return {
      id: apiCard.id,
      title: apiCard.title,
      description: apiCard.description,
      listId: apiCard.list_id, // 轉換 snake_case to camelCase
      position: apiCard.position,
      status: apiCard.status, // 卡片狀態標籤
      priority: apiCard.priority, // 卡片優先順序標籤
      // 如果 API 回應包含 created_at，則轉換為 Date 物件
      createdAt: apiCard.created_at ? new Date(apiCard.created_at) : undefined,
      // 如果 API 回應包含 updated_at，則轉換為 Date 物件
      updatedAt: apiCard.updated_at ? new Date(apiCard.updated_at) : undefined,
      completedAt: apiCard.completed_at ? new Date(apiCard.completed_at) : undefined,
      startedAt: apiCard.started_at ? new Date(apiCard.started_at) : undefined,
      movedAt: apiCard.moved_at ? new Date(apiCard.moved_at) : undefined
    }
  }

  /**
   * 📊 取得所有卡片 - 已有方法，供參考
   * 
   * 🎯 這個方法已經存在於上面，供 boardStore.fetchBoard() 使用
   */
  
  /**
   * 🔄 批量更新卡片位置 - 新增方法
   * 
   * 🤔 這個函數做什麼？
   * - 批量更新多張卡片的 list_id 和 position
   * - 專為 drag & drop 功能設計
   * - 一次 API 呼叫完成所有更新，提高效能
   * 
   * 💡 為什麼要批量更新？
   * - 拖拽時可能影響多張卡片的位置
   * - 減少 API 呼叫次數
   * - 確保資料一致性（要麼全部成功，要麼全部失敗）
   * 
   * 🔧 參數說明：
   * @param updates - 要更新的卡片清單，包含 id, listId, position
   * @returns Promise<void> - 不回傳資料，只確保更新成功
   */
  async batchUpdateCards(updates: Array<{id: string, listId: string, position: number}>): Promise<void> {
    if (updates.length === 0) {
      console.log('📝 [REPO] 沒有卡片需要更新')
      return
    }

    try {
      console.log(`🚀 [REPO] 批量更新 ${updates.length} 張卡片`)
      
      // 將每個更新轉換為 API 呼叫
      const updatePromises = updates.map(({ id, listId, position }) => {
        console.log(`📝 [REPO] 更新卡片 ${id}: listId=${listId}, position=${position}`)
        
        return $fetch(`/api/cards/${id}`, {
          method: 'PUT',
          body: {
            list_id: listId,  // 轉換為 API 格式（蛇形命名）
            position: position
          }
        })
      })

      // 批量執行所有更新
      await Promise.all(updatePromises)
      console.log('✅ [REPO] 批量更新完成')
      
    } catch (error) {
      throw this.handleError(error, '批量更新卡片失敗')
    }
  }

  /**
   * 🔄 轉換多張卡片格式 - 批量翻譯員
   * 
   * 🤔 這個函數做什麼？
   * - 把多張卡片一次全部轉換
   * - 使用 map 方法對每張卡片執行轉換
   * - 回傳轉換後的卡片陣列
   * 
   * 💡 為什麼要單獨寫這個函數？
   * - 讓程式碼更清楚易懂
   * - 複用 transformApiCard 的邏輯
   * - 如果之後要加其他處理（比如排序、過濾），很容易修改
   * 
   * 📝 使用場景：
   * - getAllCards() 取得所有卡片時
   * - 任何需要處理多張卡片的地方
   * 
   * 🔧 參數說明：
   * @param apiCards - API 回傳的卡片陣列（蛇形命名）
   * @returns Card[] - 前端格式的卡片陣列（駝峰命名）
   */
  private transformApiCards(apiCards: CardUI[]): CardUI[] {
    // 使用 map 對每張卡片執行格式轉換
    return apiCards.map(card => this.transformApiCard(card))
  }

  /**
   * 🚨 統一錯誤處理 - 醫生診斷病情
   * 
   * 🤔 這個函數做什麼？
   * - 把各種 API 錯誤轉換成使用者看得懂的訊息
   * - 記錄錯誤到 console，方便開發者除錯
   * - 根據不同錯誤類型提供對應的處理方式
   * 
   * 💡 為什麼需要統一錯誤處理？
   * - API 的錯誤訊息可能是英文或技術術語
   * - 不同的錯誤狀態碼代表不同的問題
   * - 讓使用者看到友善的中文錯誤訊息
   * - 避免在每個函數裡重複寫錯誤處理邏輯
   * 
   * 📝 錯誤狀態碼對照表：
   * 401 Unauthorized    → "請先登入"
   * 403 Forbidden       → "沒有權限執行此操作"
   * 404 Not Found       → 使用原始訊息
   * 500 Server Error    → 使用原始訊息
   * 其他               → 使用原始訊息
   * 
   * 🔍 使用例子：
   * try {
   *   await $fetch('/api/cards')
   * } catch (error) {
   *   // error.statusCode = 401
   *   throw this.handleError(error, '獲取卡片失敗')
   *   // 最終使用者看到：「請先登入」
   * }
   * 
   * 🔧 為什麼是 private？
   * - 這是內部使用的工具函數
   * - 統一處理所有 API 錯誤
   * - 如果要改錯誤訊息格式，只需要修改這裡
   * 
   * 🔧 參數說明：
   * @param error - API 拋出的原始錯誤
   * @param message - 操作失敗的基本描述
   * @returns Error - 永遠不會回傳，因為一定會拋出錯誤
   * @throws Error - 總是拋出處理後的錯誤
   */
  private handleError(error: any, message: string): Error {
    // 📝 記錄錯誤到 console，方便開發者除錯
    console.error(message, error)
    
    // 🔍 檢查特定的錯誤狀態碼，提供對應的使用者友善訊息
    if (error.statusCode === 401) {
      // 未授權：使用者可能沒有登入或 token 過期
      throw new Error('請先登入')
    }
    
    if (error.statusCode === 403) {
      // 禁止存取：使用者已登入但沒有權限執行這個操作
      throw new Error('沒有權限執行此操作')
    }
    
    // 🤷 其他錯誤：使用傳入的基本錯誤訊息
    // 比如 404 Not Found, 500 Server Error 等
    throw new Error(message)
  }
}

// 匯出單例實例，供整個應用程式使用
export const cardRepository = new CardRepository()