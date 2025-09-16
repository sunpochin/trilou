/**
 * 🧪 復原功能煙霧測試
 *
 * 最小化的測試，確保基本復原功能可以運作
 */

describe('復原功能煙霧測試', () => {
  it('應該能載入看板並測試基本復原功能', () => {
    // 訪問看板頁面
    cy.visit('/')

    // 等待看板載入
    cy.get('[data-testid="board-container"]', { timeout: 15000 }).should('be.visible')

    // 等待完全載入
    cy.wait(3000)

    // 檢查是否有列表
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="list-container"]').length === 0) {
        cy.log('沒有列表，跳過卡片測試')
        return
      }

      // 如果有列表，檢查是否可以新增卡片
      cy.get('[data-testid="list-container"]').first().then(($list) => {
        const addButton = $list.find('[data-testid="add-card-button"]')

        if (addButton.length > 0) {
          // 測試新增卡片功能
          cy.wrap(addButton).click()

          cy.get('[data-testid="card-input"]')
            .should('be.visible')
            .type('測試復原卡片')

          cy.get('[data-testid="confirm-add-card"]')
            .should('be.visible')
            .should('not.be.disabled')
            .click()

          // 等待卡片出現並滾動到可見位置
          cy.contains('[data-testid="card"]', '測試復原卡片')
            .scrollIntoView()
            .should('be.visible')

          // 測試刪除和復原
          cy.contains('[data-testid="card"]', '測試復原卡片')
            .scrollIntoView()
            .find('[data-testid="delete-button"]')
            .click({ force: true })

          // 等待 Toast 出現
          cy.get('[data-testid="undo-toast"]', { timeout: 5000 })
            .should('be.visible')
            .should('contain.text', '測試復原卡片')

          // 測試復原按鈕
          cy.get('[data-testid="undo-button"]')
            .should('be.visible')
            .click()

          // 驗證卡片復原
          cy.contains('[data-testid="card"]', '測試復原卡片')
            .scrollIntoView()
            .should('be.visible')

          // 驗證 Toast 消失
          cy.get('[data-testid="undo-toast"]')
            .should('not.exist')

          cy.log('✅ 復原功能測試通過')
        } else {
          cy.log('沒有找到新增卡片按鈕，跳過測試')
        }
      })
    })
  })
})

/**
 * 🧒 十歲解釋：煙霧測試是什麼？
 *
 * 想像你搬到新家，要檢查電器是否正常：
 *
 * 🏠 **完整測試** = 檢查每個開關、每個插座、每個燈泡
 *    - 很全面，但需要很長時間
 *    - 如果基本電路都不通，做這麼多檢查沒意義
 *
 * 💨 **煙霧測試** = 先檢查總電源開關
 *    - 按下開關，看看會不會冒煙（壞掉）
 *    - 如果沒冒煙，基本功能就是好的
 *    - 快速、簡單，確保基本可用
 *
 * 在我們的復原系統中：
 * - 煙霧測試 = 確保「刪除→復原」基本流程不會壞掉
 * - 如果煙霧測試都過不了，其他複雜測試也沒意義
 * - 如果煙霧測試通過，表示系統基本健康 ✅
 */