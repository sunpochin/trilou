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
 *
 * ======================== 🗝️ 鑰匙的故事 ========================
 *
 * 🧒 十歲小朋友解釋：為什麼要用特製鑰匙？
 *
 * 🏠 想像你住在一個大公寓，有很多房間：
 *
 * 之前的問題（用普通鑰匙）：
 * - 媽媽給你一串鑰匙，上面都寫著「房間1」、「房間2」
 * - 你想開「廁所」的門，但鑰匙上寫著「廁所」
 * - 結果你拿錯了，拿到了「廚房」的鑰匙（拼字很像！）
 * - 門打不開，而且你不知道為什麼
 * - 就像：inject('deletCard') ← 拼錯字了！
 *
 * 現在的解決方案（特製鑰匙）：
 * - 每把鑰匙都是特殊形狀，只能開對應的門
 * - 廁所鑰匙是圓形的，只能開圓形鎖孔
 * - 廚房鑰匙是方形的，只能開方形鎖孔
 * - 拿錯鑰匙？門根本插不進去，立刻知道錯了！
 *
 * 程式碼對照：
 * ```typescript
 * // 普通鑰匙（危險）
 * provide('deleteCard', deleteFunc)  // 可能打錯字
 * inject('deletCard')                // 拼錯了！拿到 undefined
 *
 * // 特製鑰匙（安全）
 * provide(DELETE_CARD_KEY, deleteFunc)  // 不會拼錯，IDE會提示
 * inject(DELETE_CARD_KEY)               // TypeScript確保型別正確
 * ```
 *
 * 為什麼特製鑰匙比較好？
 * - 🛡️ 不會拿錯：TypeScript會檢查，拿錯鑰匙會立刻報錯
 * - 🎯 知道用途：IDE會告訴你這把鑰匙開什麼門
 * - 🔄 好維護：改鑰匙名字時，所有地方都會自動更新
 * - 🎨 有提示：打字時IDE會自動完成鑰匙名稱
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