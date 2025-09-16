/**
 * 📝 Logger 工具 = 智慧型除錯助手
 *
 * 🤔 為什麼需要 Logger？
 *
 * ❌ 沒有 Logger 的世界：
 * - console.log 到處都是，上線後還在跑
 * - 用戶的控制台充滿除錯訊息
 * - 無法快速開關除錯訊息
 * - 找不到哪裡在印 log
 *
 * ✅ 有 Logger 的世界：
 * - 開發環境自動顯示 log
 * - 正式環境自動隱藏 log
 * - 可以加上顏色和圖標讓 log 更易讀
 * - 統一的 log 格式和管理
 *
 * 📋 使用方式：
 * import { logger } from '@/utils/logger'
 *
 * // 取代 console.log
 * logger.log('普通訊息')
 * logger.info('資訊訊息')
 * logger.warn('警告訊息')
 * logger.error('錯誤訊息')
 * logger.debug('除錯訊息')
 *
 * ======================== 🔇 安靜模式的故事 ========================
 *
 * 🧒 十歲小朋友解釋：為什麼要用 Logger 而不是 console.log？
 *
 * 🏫 想像程式就像一個會說話的機器人：
 *
 * 之前的問題（一直大聲說話）：
 * - 機器人用 console.log，不管在哪裡都大聲講話
 * - 在家裡（開發環境）大聲講話 ✅ 沒問題
 * - 在圖書館（正式環境）還是大聲講話 ❌ 會吵到別人！
 * - 用戶打開網站，控制台看到一堆「刪除卡片」、「載入資料」...
 * - 就像在圖書館聽到機器人一直說：「我在翻書！我找到第5頁！我在寫筆記！」
 *
 * 現在的解決方案（智慧音量控制）：
 * - 機器人學會看場合說話
 * - 在家裡（開發環境）：「我可以大聲講話幫主人除錯！」
 * - 在圖書館（正式環境）：「我要安靜，只有真正重要的事才說」
 *
 * 程式碼對照：
 * ```typescript
 * // 之前（不懂場合）
 * console.log('刪除卡片')  // 不管在哪都會講
 *
 * // 現在（智慧機器人）
 * logger.debug('刪除卡片')  // 只在開發環境講
 * logger.error('出大事了！')  // 這個重要，哪裡都要講
 * ```
 *
 * 音量等級（從小聲到大聲）：
 * - 🐛 logger.debug：最小聲（只有開發者聽得到）
 * - 📝 logger.log：普通聲音
 * - ℹ️ logger.info：重要資訊
 * - ⚠️ logger.warn：警告（比較大聲）
 * - ❌ logger.error：錯誤（最大聲，緊急事件）
 *
 * 為什麼這樣比較好？
 * - 😊 用戶開心：打開網站不會看到一堆除錯訊息
 * - 🛠️ 開發方便：開發時可以看到詳細的操作紀錄
 * - 🎯 重點清晰：真正重要的錯誤訊息不會被淹沒
 * - 🚀 效能更好：正式環境不用印一堆log，網站跑更快
 */

// 檢查是否為開發環境
const isDevelopment = process.env.NODE_ENV === 'development'

// 定義 log 等級
export enum LogLevel {
  DEBUG = 0,
  LOG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  NONE = 5
}

// 目前的 log 等級（可透過環境變數設定）
const currentLogLevel: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR

/**
 * 條件式 console.log 包裝器
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    return level >= currentLogLevel
  }

  /**
   * 除錯訊息（最詳細）
   */
  debug(...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log('🐛', ...args)
    }
  }

  /**
   * 一般訊息
   */
  log(...args: any[]): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.log(...args)
    }
  }

  /**
   * 資訊訊息
   */
  info(...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info('ℹ️', ...args)
    }
  }

  /**
   * 警告訊息
   */
  warn(...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn('⚠️', ...args)
    }
  }

  /**
   * 錯誤訊息（正式環境也會顯示）
   */
  error(...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('❌', ...args)
    }
  }

  /**
   * 群組 log（可摺疊）
   */
  group(label: string, fn: () => void): void {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  }

  /**
   * 效能測量
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label)
    }
  }

  /**
   * 表格顯示（開發用）
   */
  table(data: any): void {
    if (isDevelopment && console.table) {
      console.table(data)
    }
  }
}

// 匯出單例
export const logger = new Logger()

// 預設匯出
export default logger