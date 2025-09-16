/**
 * 🧪 復原功能 E2E 測試
 *
 * 測試使用者在真實瀏覽器環境中的復原體驗，包含：
 * - 卡片刪除和復原的完整流程
 * - Toast 通知的顯示和互動
 * - 桌面版和手機版的行為一致性
 * - 自動清理機制的時間控制
 */

describe('復原功能 E2E 測試', () => {
  beforeEach(() => {
    // 訪問看板頁面
    cy.visit('/')

    // 等待看板載入完成
    cy.waitForBoard()
  })

  describe('桌面版復原功能', () => {
    beforeEach(() => {
      // 確保使用桌面版視窗大小
      cy.viewport(1280, 720)
    })

    it('應該能刪除卡片並顯示復原 Toast', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 桌面版刪除'
      cy.createTestCard(cardTitle)

      // 找到並刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 確認卡片從列表中消失
      cy.contains('[data-testid="card"]', cardTitle).should('not.exist')

      // 確認 Toast 出現
      cy.waitForToast()
        .should('contain.text', cardTitle)
        .should('contain.text', '已刪除')

      // 確認復原按鈕存在
      cy.get('[data-testid="undo-button"]').should('be.visible')
    })

    it('應該能成功復原被刪除的卡片', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 桌面版復原'
      cy.createTestCard(cardTitle)

      // 刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待 Toast 出現
      cy.waitForToast()

      // 點擊復原按鈕
      cy.get('[data-testid="undo-button"]').click()

      // 確認卡片重新出現
      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')

      // 確認 Toast 消失
      cy.get('[data-testid="undo-toast"]').should('not.exist')
    })

    it('應該能關閉復原 Toast', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 關閉 Toast'
      cy.createTestCard(cardTitle)

      // 刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待 Toast 出現
      cy.waitForToast()

      // 點擊關閉按鈕
      cy.get('[data-testid="close-toast-button"]').click()

      // 確認 Toast 消失
      cy.get('[data-testid="undo-toast"]').should('not.exist')

      // 確認卡片仍然不存在（沒有復原）
      cy.contains('[data-testid="card"]', cardTitle).should('not.exist')
    })
  })

  describe('手機版復原功能', () => {
    beforeEach(() => {
      // 設定手機版視窗大小
      cy.viewport(375, 667)
    })

    it('應該在手機版正常顯示復原 Toast', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 手機版'
      cy.createTestCard(cardTitle)

      // 找到並刪除卡片（手機版可能使用不同的刪除方式）
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 確認 Toast 在手機版正確顯示
      cy.waitForToast()
        .should('be.visible')
        .should('contain.text', cardTitle)

      // 確認 Toast 位置適合手機版
      cy.get('[data-testid="undo-toast"]')
        .should('have.css', 'position', 'fixed')
    })

    it('應該在手機版能正常復原卡片', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 手機版復原'
      cy.createTestCard(cardTitle)

      // 刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待 Toast 出現並點擊復原
      cy.waitForToast()
      cy.get('[data-testid="undo-button"]').click()

      // 確認卡片復原
      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')
    })
  })

  describe('自動清理機制', () => {
    it('應該在 10 秒後自動隱藏 Toast', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 自動清理'
      cy.createTestCard(cardTitle)

      // 刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 確認 Toast 出現
      cy.waitForToast()

      // 等待 10 秒（加上一點緩衝時間）
      cy.wait(11000)

      // 確認 Toast 自動消失
      cy.get('[data-testid="undo-toast"]').should('not.exist')

      // 這時候卡片應該已經永久刪除，無法復原
      // 注意：這個測試需要後端 API 支援永久刪除
    })

    it('復原後應該取消自動清理計時器', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 取消計時器'
      cy.createTestCard(cardTitle)

      // 刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待 Toast 出現
      cy.waitForToast()

      // 等待 5 秒後復原（在自動清理前）
      cy.wait(5000)
      cy.get('[data-testid="undo-button"]').click()

      // 確認卡片復原
      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')

      // 再等待 6 秒（總計超過 10 秒），確認沒有額外的自動清理
      cy.wait(6000)

      // 卡片應該仍然存在（計時器已被取消）
      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')
    })
  })

  describe('多卡片復原', () => {
    it('應該只復原最後刪除的卡片', () => {
      // 創建多張測試卡片
      const card1Title = '測試卡片 1'
      const card2Title = '測試卡片 2'

      cy.createTestCard(card1Title)
      cy.createTestCard(card2Title)

      // 先刪除第一張卡片
      cy.contains('[data-testid="card"]', card1Title)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待第一個 Toast 出現後關閉
      cy.waitForToast()
      cy.get('[data-testid="close-toast-button"]').click()

      // 刪除第二張卡片
      cy.contains('[data-testid="card"]', card2Title)
        .find('[data-testid="delete-button"]')
        .click()

      // 等待第二個 Toast 出現
      cy.waitForToast().should('contain.text', card2Title)

      // 點擊復原，應該只復原第二張卡片
      cy.get('[data-testid="undo-button"]').click()

      // 確認只有第二張卡片復原
      cy.contains('[data-testid="card"]', card2Title).should('be.visible')
      cy.contains('[data-testid="card"]', card1Title).should('not.exist')
    })
  })

  describe('錯誤處理', () => {
    it('應該處理網路錯誤的情況', () => {
      // 模擬網路中斷
      cy.intercept('DELETE', '/api/cards/*', { forceNetworkError: true })

      // 創建測試卡片
      const cardTitle = '測試卡片 - 網路錯誤'
      cy.createTestCard(cardTitle)

      // 嘗試刪除卡片
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .click()

      // 應該仍然顯示復原 Toast（樂觀更新）
      cy.waitForToast().should('contain.text', cardTitle)

      // 點擊復原應該仍然有效
      cy.get('[data-testid="undo-button"]').click()
      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')
    })
  })

  describe('觸控裝置支援', () => {
    beforeEach(() => {
      cy.viewport('iphone-6')
    })

    it('應該支援觸控刪除操作', () => {
      // 創建測試卡片
      const cardTitle = '測試卡片 - 觸控'
      cy.createTestCard(cardTitle)

      // 使用觸控事件刪除
      cy.contains('[data-testid="card"]', cardTitle)
        .find('[data-testid="delete-button"]')
        .trigger('touchstart')
        .trigger('touchend')

      // 確認 Toast 出現
      cy.waitForToast().should('contain.text', cardTitle)

      // 確認觸控復原功能
      cy.get('[data-testid="undo-button"]')
        .trigger('touchstart')
        .trigger('touchend')

      cy.contains('[data-testid="card"]', cardTitle).should('be.visible')
    })
  })
})

/**
 * 🧒 十歲解釋：為什麼要寫 E2E 測試？
 *
 * 想像你開了一家「神奇復原餐廳」：
 *
 * **🏠 單元測試 vs E2E 測試的差別：**
 *
 * 🔧 **單元測試** = 檢查廚房設備
 * - 確認烤箱能加熱
 * - 確認冰箱能保冷
 * - 確認刀具很鋒利
 * - 但不知道能不能做出美味料理
 *
 * 🍽️ **E2E 測試** = 真實客人用餐體驗
 * - 客人進門點餐
 * - 廚師做菜
 * - 服務生送餐
 * - 客人滿意離開
 * - 測試整個流程是否順暢
 *
 * **🎯 E2E 測試檢查什麼？**
 *
 * 1. **完整用餐流程**：
 *    - 客人能找到刪除按鈕嗎？
 *    - 點擊後會出現「可以復原」的通知嗎？
 *    - 復原按鈕真的能把東西找回來嗎？
 *
 * 2. **不同客人的體驗**：
 *    - 用電腦的客人（桌面版）
 *    - 用手機的客人（手機版）
 *    - 用平板的客人（觸控版）
 *
 * 3. **特殊情況處理**：
 *    - 如果廚房突然停電（網路錯誤）會怎樣？
 *    - 如果客人等太久（10秒自動清理）會怎樣？
 *    - 如果客人改變主意（點復原按鈕）會怎樣？
 *
 * 4. **真實環境測試**：
 *    - 在真實的瀏覽器中運行
 *    - 模擬真實的使用者操作
 *    - 確保所有功能整合後還能正常工作
 *
 * **💡 為什麼兩種測試都需要？**
 *
 * 🔧 **單元測試**：快速、便宜，像品管員檢查每個零件
 * 🍽️ **E2E 測試**：慢但全面，像神秘客體驗整個服務
 *
 * 就像餐廳需要確保：
 * - 每個廚具都能正常運作（單元測試）
 * - 整體用餐體驗讓客人滿意（E2E 測試）
 *
 * 這樣我們的「神奇復原餐廳」就能給客人最棒的體驗！
 */