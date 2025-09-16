/**
 * 🧪 基礎復原功能 E2E 測試
 *
 * 先測試最核心的復原功能，確保基本流程正確運作
 */

describe('基礎復原功能測試', () => {
  beforeEach(() => {
    // 訪問看板頁面
    cy.visit('/')

    // 等待看板容器載入
    cy.get('[data-testid="board-container"]', { timeout: 15000 }).should('be.visible')

    // 等待任何載入狀態結束
    cy.wait(2000)

    // 確保頁面已經完全載入
    cy.get('body').should('be.visible')
  })

  it('應該能成功載入看板', () => {
    // 驗證看板容器存在
    cy.get('[data-testid="board-container"]').should('be.visible')

    // 如果有列表，驗證列表存在；如果沒有列表，也是正常的
    cy.get('body').then(($body) => {
      const listContainers = $body.find('[data-testid="list-container"]')
      if (listContainers.length > 0) {
        cy.log(`找到 ${listContainers.length} 個列表`)
      } else {
        cy.log('看板載入成功，但沒有找到列表')
      }
    })
  })

  it('應該能新增卡片', () => {
    // 創建測試卡片
    const cardTitle = '基礎測試卡片'
    cy.createTestCard(cardTitle)

    // 驗證卡片存在
    cy.contains('[data-testid="card"]', cardTitle).should('be.visible')
  })

  it('應該能刪除卡片並顯示復原 Toast', () => {
    // 先創建一張卡片
    const cardTitle = '要被刪除的卡片'
    cy.createTestCard(cardTitle)

    // 找到卡片並刪除
    cy.contains('[data-testid="card"]', cardTitle)
      .find('[data-testid="delete-button"]')
      .click({ force: true }) // 使用 force 因為按鈕可能需要 hover

    // 驗證卡片消失
    cy.contains('[data-testid="card"]', cardTitle).should('not.exist')

    // 驗證復原 Toast 出現
    cy.get('[data-testid="undo-toast"]', { timeout: 5000 })
      .should('be.visible')
      .should('contain.text', cardTitle)

    // 驗證復原按鈕存在
    cy.get('[data-testid="undo-button"]').should('be.visible')
  })

  it('應該能復原被刪除的卡片', () => {
    // 先創建並刪除一張卡片
    const cardTitle = '要被復原的卡片'
    cy.createTestCard(cardTitle)

    // 刪除卡片
    cy.contains('[data-testid="card"]', cardTitle)
      .find('[data-testid="delete-button"]')
      .click({ force: true })

    // 等待 Toast 出現
    cy.get('[data-testid="undo-toast"]', { timeout: 5000 }).should('be.visible')

    // 點擊復原按鈕
    cy.get('[data-testid="undo-button"]').click()

    // 驗證卡片復原
    cy.contains('[data-testid="card"]', cardTitle).should('be.visible')

    // 驗證 Toast 消失
    cy.get('[data-testid="undo-toast"]').should('not.exist')
  })

  it('應該能關閉復原 Toast', () => {
    // 先創建並刪除一張卡片
    const cardTitle = '測試關閉 Toast'
    cy.createTestCard(cardTitle)

    // 刪除卡片
    cy.contains('[data-testid="card"]', cardTitle)
      .find('[data-testid="delete-button"]')
      .click({ force: true })

    // 等待 Toast 出現
    cy.get('[data-testid="undo-toast"]', { timeout: 5000 }).should('be.visible')

    // 點擊關閉按鈕
    cy.get('[data-testid="close-toast-button"]').click()

    // 驗證 Toast 消失
    cy.get('[data-testid="undo-toast"]').should('not.exist')

    // 驗證卡片仍然不存在（沒有復原）
    cy.contains('[data-testid="card"]', cardTitle).should('not.exist')
  })
})

/**
 * 🧒 十歲解釋：這個基礎測試在做什麼？
 *
 * 想像你在玩一個「神奇消除」遊戲：
 *
 * 1. **準備遊戲** (beforeEach)：
 *    - 打開遊戲畫面
 *    - 等待遊戲載入完成
 *    - 確保有遊戲板可以玩
 *
 * 2. **測試基本功能**：
 *    - 能不能看到遊戲板？ ✅
 *    - 能不能放新的積木？ ✅
 *    - 能不能把積木消除？ ✅
 *
 * 3. **測試神奇復原功能**：
 *    - 積木消除後，會不會出現「可以復原」的提示？ ✅
 *    - 點擊「復原」按鈕，積木會不會回來？ ✅
 *    - 點擊「關閉」按鈕，提示會不會消失？ ✅
 *
 * 這些測試確保「神奇復原」功能在真實環境中正常工作！
 */