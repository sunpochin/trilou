// Cypress E2E 測試支援文件

import './commands'

// 全域設定
Cypress.on('uncaught:exception', (err, runnable) => {
  // 防止 Cypress 因為未捕獲的應用程式錯誤而失敗
  // 在開發階段這些錯誤可能是預期的
  return false
})

// 視窗大小設定
beforeEach(() => {
  // 確保每個測試都有一致的視窗大小
  cy.viewport(1280, 720)
})

// 等待應用程式載入的輔助函數
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 等待看板載入完成
       */
      waitForBoard(): Chainable<void>

      /**
       * 創建測試卡片
       */
      createTestCard(title: string, listIndex?: number): Chainable<void>

      /**
       * 等待 Toast 訊息出現
       */
      waitForToast(): Chainable<JQuery<HTMLElement>>
    }
  }
}