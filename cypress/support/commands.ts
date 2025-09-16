// Cypress 自訂命令

/**
 * 等待看板載入完成
 */
Cypress.Commands.add('waitForBoard', () => {
  // 等待看板容器載入
  cy.get('[data-testid="board-container"]', { timeout: 15000 }).should('be.visible')

  // 等待載入狀態結束 (如果有骨架屏，等待消失)
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skeleton-loader"]').length > 0) {
      cy.get('[data-testid="skeleton-loader"]', { timeout: 15000 }).should('not.exist')
    }
  })

  // 檢查是否有列表，如果沒有就創建一個
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="list-container"]').length === 0) {
      // 如果沒有列表，創建一個測試列表
      cy.log('沒有發現列表，創建測試列表')

      // 嘗試多種可能的新增列表按鈕文字
      cy.get('button').then(($buttons) => {
        const possibleTexts = ['新增列表', '+ 新增列表', 'Add List', '添加列表']
        let found = false

        for (const text of possibleTexts) {
          const matchingButton = $buttons.filter((i, el) => Cypress.$(el).text().includes(text))
          if (matchingButton.length > 0) {
            cy.wrap(matchingButton.first()).click()
            found = true
            break
          }
        }

        if (!found) {
          // 如果找不到特定文字，嘗試找到包含 "+" 的按鈕
          const addButton = $buttons.filter((i, el) => Cypress.$(el).text().includes('+'))
          if (addButton.length > 0) {
            cy.wrap(addButton.first()).click()
          }
        }
      })

      // 輸入列表標題
      cy.get('input').then(($inputs) => {
        const titleInput = $inputs.filter((i, el) => {
          const placeholder = Cypress.$(el).attr('placeholder') || ''
          return placeholder.includes('標題') || placeholder.includes('title') || placeholder.includes('列表')
        })
        if (titleInput.length > 0) {
          cy.wrap(titleInput.first()).type('測試列表{enter}')
        }
      })
    }
  })

  // 確保至少有一個列表容器
  cy.get('[data-testid="list-container"]', { timeout: 10000 }).should('have.length.gte', 1)
})

/**
 * 創建測試卡片
 */
Cypress.Commands.add('createTestCard', (title: string, listIndex: number = 0) => {
  // 點擊指定列表的新增卡片按鈕
  cy.get('[data-testid="list-container"]')
    .eq(listIndex)
    .find('[data-testid="add-card-button"]')
    .should('be.visible')
    .click()

  // 輸入卡片標題
  cy.get('[data-testid="card-input"]')
    .should('be.visible')
    .type(title)

  // 確認新增
  cy.get('[data-testid="confirm-add-card"]')
    .should('be.visible')
    .should('not.be.disabled')
    .click()

  // 等待卡片出現
  cy.contains('[data-testid="card"]', title)
    .should('be.visible')

  // 驗證卡片確實創建成功
  cy.get('[data-testid="list-container"]')
    .eq(listIndex)
    .find('[data-testid="card"]')
    .should('contain.text', title)
})

/**
 * 等待 Toast 訊息出現
 */
Cypress.Commands.add('waitForToast', () => {
  return cy.get('[data-testid="undo-toast"]', { timeout: 5000 }).should('be.visible')
})