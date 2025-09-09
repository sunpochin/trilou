/**
 * 🎯 EventBus - 組件間通訊的廣播系統
 * 
 * ## 📚 為什麼要用 EventBus？
 * 
 * ### 問題：組件直接依賴的困境
 * ```typescript
 * // ❌ 壞方法：組件必須互相認識
 * class CardComponent {
 *   constructor(private listComponent: ListComponent) {}
 *   addCard() {
 *     this.listComponent.updateCount() // 耦合太緊密
 *   }
 * }
 * ```
 * 
 * ### 解決方案：EventBus 廣播系統
 * ```typescript
 * // ✅ 好方法：透過事件溝通
 * // Card 組件：廣播訊息
 * eventBus.emit('card:created', { cardId: '123', title: '新卡片' })
 * 
 * // List 組件：收聽訊息
 * eventBus.on('card:created', (data) => {
 *   updateCardCount()
 * })
 * ```
 * 
 * ## 🚀 快速使用指南
 * 
 * ### 1️⃣ 基本使用
 * ```typescript
 * import { eventBus } from '@/events/EventBus'
 * 
 * // 發送事件
 * eventBus.emit('card:created', { 
 *   cardId: '123', 
 *   listId: 'abc',
 *   title: '買牛奶' 
 * })
 * 
 * // 監聽事件
 * eventBus.on('card:created', (data) => {
 *   console.log(`新卡片：${data.title}`)
 * })
 * 
 * // 取消監聽
 * eventBus.off('card:created', callback)
 * ```
 * 
 * ### 2️⃣ 一次性監聽
 * ```typescript
 * // 只監聽一次，自動取消
 * eventBus.once('user:login', (data) => {
 *   showWelcomeMessage(`歡迎 ${data.email}！`)
 * })
 * ```
 * 
 * ### 3️⃣ 在 Vue 組件中使用
 * ```typescript
 * import { onMounted, onUnmounted } from 'vue'
 * import { eventBus } from '@/events/EventBus'
 * 
 * export default {
 *   setup() {
 *     const handleCardCreated = (data) => {
 *       // 處理卡片建立事件
 *     }
 *     
 *     onMounted(() => {
 *       eventBus.on('card:created', handleCardCreated)
 *     })
 *     
 *     onUnmounted(() => {
 *       eventBus.off('card:created', handleCardCreated)
 *     })
 *   }
 * }
 * ```
 * 
 * ## 📋 可用事件列表
 * - `card:created` - 卡片建立時
 * - `card:deleted` - 卡片刪除時
 * - `card:moved` - 卡片移動時
 * - `list:created` - 列表建立時
 * - `list:deleted` - 列表刪除時
 * - `user:login` - 使用者登入時
 * - `user:logout` - 使用者登出時
 * - `notification:show` - 顯示通知時
 * - `error:occurred` - 發生錯誤時
 * 
 * 💡 更多概念說明請參考 docs/ARCHITECTURE.md
 */

/**
 * 📢 Observer Pattern = 學校廣播系統
 * 
 * 🤔 想像學校裡發生了重要的事：
 * 
 * ❌ 沒有廣播的世界：
 * - 老師要一間間教室跑去通知「下課了」
 * - 如果有新教室，老師要記得去通知
 * - 如果老師忘記通知某間教室，學生就不知道下課了
 * 
 * ✅ 有廣播系統的世界：
 * - 老師對著廣播說「下課了」
 * - 所有教室的喇叭都會播放這個訊息
 * - 新教室？裝個喇叭就自動收到通知了
 * - 某間教室不想聽？把喇叭關掉就好
 * 
 * 🎯 這個檔案就是「程式碼的廣播系統」：
 * - 當卡片被新增時，廣播「有新卡片了」
 * - 想要知道的組件就「打開喇叭」收聽
 * - 不關心的組件就不用理會
 * 
 * 📝 使用方式：
 * // 廣播訊息（像老師對廣播講話）
 * eventBus.emit('card:created', { cardId: '123', title: '新卡片' })
 * 
 * // 收聽訊息（像教室安裝喇叭）
 * eventBus.on('card:created', (data) => {
 *   console.log('收到新卡片:', data.title)
 * })
 * 
 * 💡 簡單說：不要讓組件直接找對方，用廣播系統傳消息比較好
 */

/**
 * 📋 事件類型定義 - 就像廣播電台的節目表
 * 
 * 🤔 為什麼要定義這些？
 * - 確保每個事件的資料格式都是對的
 * - 讓 TypeScript 幫我們檢查拼字錯誤
 * - 讓其他開發者知道有哪些事件可以使用
 */
export interface AppEvents {
  // 卡片相關事件
  'card:created': { cardId: string, listId: string, title: string }    // 新增卡片時廣播
  'card:deleted': { cardId: string, listId: string }                   // 刪除卡片時廣播
  'card:moved': { cardId: string, fromListId: string, toListId: string } // 移動卡片時廣播
  
  // 列表相關事件
  'list:created': { listId: string, title: string }                    // 新增列表時廣播
  'list:deleted': { listId: string }                                   // 刪除列表時廣播
  
  // 使用者相關事件
  'user:login': { userId: string, email: string }                      // 使用者登入時廣播
  'user:logout': { userId: string }                                    // 使用者登出時廣播
  
  // 系統相關事件
  'notification:show': { type: 'success' | 'error' | 'info', message: string } // 顯示通知時廣播
  'notification:error': { title: string, message: string, duration?: number } // 錯誤通知事件
  'error:occurred': { error: Error, context: string }                  // 發生錯誤時廣播
}

/**
 * 📞 事件回調函數的型別定義
 * 
 * 🤔 這是什麼？
 * - 就像電話的「接聽函數」
 * - 當事件發生時，這個函數會被呼叫
 * - T 是傳入資料的型別（比如卡片資料、錯誤資料等）
 */
type EventCallback<T = any> = (data: T) => void

export class EventBus {
  /**
   * 🏠 靜態實例 - 整個應用共用的唯一 EventBus
   * 
   * 🤔 為什麼要用 static？
   * - 確保整個應用只有一個廣播系統
   * - 就像學校只有一個廣播室，不會有兩個廣播室同時廣播
   */
  private static instance: EventBus
  
  /**
   * 📻 監聽器容器 - 存放所有「喇叭」的地方
   * 
   * 🤔 Map 結構說明：
   * - Key: 事件名稱 (例如: 'card:created')
   * - Value: 監聽這個事件的所有函數陣列
   * 
   * 📝 例子：
   * Map {
   *   'card:created' => [函數A, 函數B, 函數C],
   *   'list:deleted' => [函數D, 函數E]
   * }
   */
  private listeners: Map<string, EventCallback[]> = new Map()

  /**
   * 🏗️ 單例模式 - 取得唯一的 EventBus 實例
   * 
   * 🤔 什麼是單例模式？
   * - 就像政府只能有一個總統
   * - 確保整個應用只有一個事件廣播系統
   * - 無論在哪裡呼叫，都會得到同一個 EventBus
   * 
   * 📝 使用方式：
   * const eventBus1 = EventBus.getInstance()
   * const eventBus2 = EventBus.getInstance()
   * // eventBus1 === eventBus2 (是同一個物件)
   */
  static getInstance(): EventBus {
    // 如果還沒有實例，就建立一個
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    // 回傳唯一的實例
    return EventBus.instance
  }

  /**
   * 🔊 訂閱事件 - 在教室裡安裝喇叭
   * 
   * 🤔 這個函數做什麼？
   * - 告訴系統：「當 XXX 事件發生時，請呼叫我的函數」
   * - 就像在教室安裝喇叭，當廣播時就會播放
   * 
   * 📝 使用例子：
   * eventBus.on('card:created', (data) => {
   *   console.log('有新卡片:', data.title)
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要監聽的事件名稱 (例如: 'card:created')
   * @param callback - 事件發生時要執行的函數
   */
  on<K extends keyof AppEvents>(event: K, callback: EventCallback<AppEvents[K]>): void {
    // 檢查這個事件是否已經有監聽器陣列了
    if (!this.listeners.has(event)) {
      // 如果沒有，就建立一個空陣列
      this.listeners.set(event, [])
    }
    // 把新的監聽函數加到陣列裡
    this.listeners.get(event)!.push(callback)
  }

  /**
   * 🔇 取消訂閱 - 把教室的喇叭拆掉
   * 
   * 🤔 這個函數做什麼？
   * - 告訴系統：「我不想再聽這個事件了」
   * - 就像把教室的喇叭拆掉，之後廣播就聽不到了
   * 
   * 📝 使用例子：
   * const myCallback = (data) => console.log(data)
   * eventBus.on('card:created', myCallback)     // 開始監聽
   * eventBus.off('card:created', myCallback)    // 停止監聽
   * 
   * 🔧 參數說明：
   * @param event - 要停止監聽的事件名稱
   * @param callback - 要移除的監聽函數（必須是同一個函數物件）
   */
  off<K extends keyof AppEvents>(event: K, callback: EventCallback<AppEvents[K]>): void {
    // 取得這個事件的所有監聽器
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      // 找到要移除的函數在陣列中的位置
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        // 從陣列中移除這個函數
        eventListeners.splice(index, 1)
        // 如果移除後陣列為空，就從 Map 中刪除這個事件，避免記憶體洩漏
        if (eventListeners.length === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  /**
   * 📢 發布事件 - 校長對著廣播系統說話
   * 
   * 🤔 這個函數做什麼？
   * - 向所有監聽這個事件的函數發送訊息
   * - 就像校長說「下課了」，所有教室的喇叭都會播放
   * 
   * 📝 使用例子：
   * eventBus.emit('card:created', {
   *   cardId: '123',
   *   listId: 'abc',
   *   title: '我的新卡片'
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要發布的事件名稱
   * @param data - 要傳送的資料
   */
  emit<K extends keyof AppEvents>(event: K, data: AppEvents[K]): void {
    // 取得所有監聽這個事件的函數
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      // 🛡️ 安全措施：複製陣列避免在執行過程中被修改
      // 為什麼要複製？因為在執行回調函數時，可能會有其他程式碼修改監聽器陣列
      [...eventListeners].forEach(callback => {
        try {
          // 呼叫每個監聽函數，把資料傳給它
          callback(data)
        } catch (error) {
          // 🚨 錯誤處理：如果某個監聽函數出錯，不要影響其他函數
          console.error(`事件處理器錯誤 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 🎯 一次性訂閱 - 只聽一次就自動拆掉喇叭
   * 
   * 🤔 這個函數做什麼？
   * - 監聽事件，但只觸發一次，之後就自動停止監聽
   * - 就像臨時裝個喇叭，聽到廣播後就自動拆掉
   * 
   * 📝 使用場景：
   * - 等待使用者第一次登入
   * - 等待某個一次性的初始化完成
   * - 等待某個只會發生一次的事件
   * 
   * 💡 使用例子：
   * eventBus.once('user:login', (data) => {
   *   console.log('歡迎首次登入!', data.email)
   *   // 這個函數只會執行一次，之後就不會再執行了
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要監聽的事件名稱
   * @param callback - 事件發生時要執行的函數（只執行一次）
   */
  once<K extends keyof AppEvents>(event: K, callback: EventCallback<AppEvents[K]>): void {
    // 建立一個包裝函數
    const onceCallback = (data: AppEvents[K]) => {
      try {
        // 先執行使用者提供的回調函數
        callback(data)
      } finally {
        // 執行完後立刻移除這個監聽器，確保只執行一次
        this.off(event, onceCallback)
      }
    }
    // 註冊這個包裝函數作為監聽器
    this.on(event, onceCallback)
  }

  /**
   * 🧹 清除所有監聽器 - 把學校所有喇叭都拆掉
   * 
   * 🤔 什麼時候會用到？
   * - 應用程式關閉時
   * - 重置整個事件系統時
   * - 測試完成後清理環境時
   * 
   * ⚠️ 注意：這會移除所有事件的所有監聽器！
   * 
   * 📝 使用例子：
   * // 在應用關閉時清理
   * window.addEventListener('beforeunload', () => {
   *   eventBus.removeAllListeners()
   * })
   */
  removeAllListeners(): void {
    // 清空整個 Map，移除所有事件的所有監聽器
    this.listeners.clear()
  }

  /**
   * 🔍 除錯功能 - 查看目前有多少喇叭在運作
   * 
   * 🤔 這個函數做什麼？
   * - 幫助開發者了解目前有多少監聽器在運作
   * - 用來除錯或監控系統狀態
   * 
   * 📝 使用例子：
   * // 查看特定事件的監聽器數量
   * const count = eventBus.getListenerCount('card:created')  // 回傳數字
   * 
   * // 查看所有事件的監聽器數量
   * const allCounts = eventBus.getListenerCount()  // 回傳物件
   * // 結果像這樣：{ 'card:created': 3, 'list:deleted': 1 }
   * 
   * 🔧 參數說明：
   * @param event - 可選，指定要查看的事件名稱
   * @returns 如果有指定事件，回傳數字；如果沒指定，回傳所有事件的統計物件
   */
  getListenerCount(event?: keyof AppEvents): number | Record<string, number> {
    if (event) {
      // 如果指定了事件，回傳該事件的監聽器數量
      return this.listeners.get(event)?.length || 0
    }
    
    // 如果沒指定事件，回傳所有事件的統計
    const counts: Record<string, number> = {}
    this.listeners.forEach((listeners, eventName) => {
      counts[eventName] = listeners.length
    })
    return counts
  }
}

/**
 * 🚀 匯出預設的 EventBus 實例
 * 
 * 🤔 為什麼要這樣做？
 * - 讓其他檔案可以直接 import 使用，不用每次都寫 EventBus.getInstance()
 * - 確保整個應用使用的都是同一個 EventBus 實例
 * 
 * 📝 使用方式：
 * import { eventBus } from '@/events/EventBus'
 * 
 * eventBus.on('card:created', callback)
 * eventBus.emit('card:created', data)
 */
export const eventBus = EventBus.getInstance()