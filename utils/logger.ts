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