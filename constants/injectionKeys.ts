/**
 * 🔑 Injection Keys = 依賴注入的鑰匙
 *
 * 🤔 為什麼需要 Injection Keys？
 *
 * ❌ 沒有型別安全的世界：
 * - provide('deleteCard', deleteFunc) - 字串 key 容易打錯
 * - inject('deleteCard') - 不知道會拿到什麼型別
 * - inject('deletCard') - 拼錯了，拿到 undefined
 * - TypeScript 無法檢查型別正確性
 *
 * ✅ 有型別安全的世界：
 * - provide(DELETE_CARD_KEY, deleteFunc) - 統一的 key，不會拼錯
 * - inject(DELETE_CARD_KEY) - TypeScript 知道確切的型別
 * - 重構時更安全，改一個地方全部更新
 * - IDE 提供自動完成和型別提示
 *
 * 📋 使用方式：
 * 1. 在父組件 provide：
 *    provide(DELETE_CARD_KEY, deleteCardWithUndo)
 *
 * 2. 在子組件 inject：
 *    const deleteCard = inject(DELETE_CARD_KEY)
 *    // TypeScript 知道 deleteCard 的型別！
 */

import type { InjectionKey } from 'vue'
import type { CardUI } from '@/types'

/**
 * 🗑️ 卡片刪除函數的注入鍵
 * 用於在組件樹中傳遞刪除卡片的功能
 */
export const DELETE_CARD_KEY: InjectionKey<
  (card: CardUI) => Promise<void>
> = Symbol('deleteCard')

/**
 * 🎨 主題切換函數的注入鍵（範例，未來擴充用）
 */
export const THEME_KEY: InjectionKey<{
  isDark: boolean
  toggle: () => void
}> = Symbol('theme')

/**
 * 🔔 通知系統的注入鍵（範例，未來擴充用）
 */
export const NOTIFICATION_KEY: InjectionKey<{
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
}> = Symbol('notification')