# 🧪 Trello Clone 測試指南

## 📋 測試概覽

這個專案使用 **Test-Driven Development (TDD)** 方法開發，確保程式碼品質和可靠性。

### 🛠️ 測試技術棧

- **測試框架**: Vitest (Vue 生態系推薦)
- **組件測試**: Vue Test Utils + Testing Library
- **覆蓋率**: V8 Coverage
- **Mock**: Vitest 內建 Mock 功能
- **斷言**: Vitest 內建 expect + jest-dom

## 📁 測試結構

```
tests/
├── setup.ts                    # 測試環境設定
├── fixtures/                   # 測試資料
│   └── testData.ts             # 統一的模擬資料
└── unit/                       # 單元測試
    ├── components/             # Vue 組件測試
    │   └── Card.test.ts
    ├── composables/            # Composables 測試
    ├── repositories/           # Repository 測試
    │   └── CardRepository.test.ts
    ├── factories/              # Factory 測試
    │   └── EntityFactory.test.ts
    ├── events/                 # 事件系統測試
    │   └── EventBus.test.ts
    ├── stores/                 # Pinia Store 測試
    ├── builders/               # Builder Pattern 測試
    └── validators/             # 驗證邏輯測試
```

## 🚀 快速開始

### 安裝依賴
```bash
yarn install
```

### 執行測試
```bash
# 執行所有測試
yarn test

# 監看模式（開發時推薦）
yarn test:watch

# 執行測試並生成覆蓋率報告
yarn test:coverage

# 只執行單元測試
yarn test:unit

# 執行測試並開啟覆蓋率報告
yarn test:coverage:open
```

## 📊 測試類型

### 1. 單元測試 (Unit Tests)

測試單一函數或類別的功能：

```typescript
// EntityFactory 測試範例
describe('EntityFactory', () => {
  it('should create card with unique ID', () => {
    const card = EntityFactory.createCard({
      title: '測試卡片',
      listId: 'list_123'
    })
    
    expect(card.id).toMatch(/^card_\w+_\w+$/)
    expect(card.title).toBe('測試卡片')
  })
})
```

### 2. 組件測試 (Component Tests)

測試 Vue 組件的渲染和互動：

```typescript
// Card 組件測試範例
describe('Card.vue', () => {
  it('should emit delete event when delete button clicked', async () => {
    const { emitted } = render(Card, {
      props: { card: mockCard }
    })
    
    await fireEvent.click(screen.getByRole('button', { name: /刪除/ }))
    
    expect(emitted()).toHaveProperty('delete')
  })
})
```

### 3. 整合測試 (Integration Tests)

測試多個元件間的協作：

```typescript
// Repository + Factory 整合測試
describe('Card Creation Flow', () => {
  it('should create and validate card through complete flow', async () => {
    const cardRepo = new CardRepository()
    const newCard = await cardRepo.createCard('新卡片', 'list_123')
    const errors = EntityFactory.validateCard(newCard)
    
    expect(errors).toEqual([])
    expect(newCard.id).toBeDefined()
  })
})
```

## 🎯 TDD 開發流程

### Red-Green-Refactor 循環

1. **🔴 Red**: 先寫會失敗的測試
```typescript
it('should create card with auto-generated ID', () => {
  const card = EntityFactory.createCard({ title: '測試' })
  expect(card.id).toMatch(/^card_\w+$/)  // 這會失敗
})
```

2. **🟢 Green**: 寫最少的程式碼讓測試通過
```typescript
static createCard(params) {
  return {
    id: 'card_' + Math.random().toString(36),
    title: params.title
  }
}
```

3. **🔵 Refactor**: 重構程式碼，保持測試通過
```typescript
static createCard(params: CreateCardParams): Card {
  return {
    id: this.generateId('card'),
    title: params.title.trim(),
    // ... 其他欄位
  }
}
```

## 📝 測試撰寫規範

### 測試命名

使用 `should [行為] when [條件]` 格式：

```typescript
describe('CardRepository', () => {
  describe('createCard', () => {
    it('should return card with correct format when API call succeeds', () => {
      // 測試內容
    })
    
    it('should throw error when API call fails', () => {
      // 測試內容
    })
  })
})
```

### 測試結構 (AAA Pattern)

```typescript
it('should do something', () => {
  // 🎯 Arrange - 準備測試資料
  const mockData = { id: '123', title: '測試' }
  global.$fetch = vi.fn().mockResolvedValue(mockData)
  
  // 🎯 Act - 執行要測試的功能
  const result = await repository.getData()
  
  // 🎯 Assert - 驗證結果
  expect(result).toEqual(mockData)
  expect($fetch).toHaveBeenCalledWith('/api/data')
})
```

### Mock 使用

```typescript
// Mock 外部依賴
beforeEach(() => {
  global.$fetch = vi.fn()
  vi.clearAllMocks()
})

// Mock 特定回應
global.$fetch = vi.fn().mockResolvedValue(mockApiResponse)

// Mock 錯誤
global.$fetch = vi.fn().mockRejectedValue(new Error('API Error'))
```

## 📊 覆蓋率目標

目前設定的覆蓋率門檻：

- **分支覆蓋率**: 80%
- **函數覆蓋率**: 80%
- **程式行覆蓋率**: 80%
- **語句覆蓋率**: 80%

### 查看覆蓋率報告

```bash
# 生成並開啟覆蓋率報告
yarn test:coverage:open
```

覆蓋率報告會顯示：
- 哪些程式碼已被測試
- 哪些分支沒有被執行
- 需要補強測試的地方

## 🔧 測試工具

### 使用測試資料

```typescript
import { mockCards, mockApiResponses, testHelpers } from '@/tests/fixtures/testData'

// 使用預定義的測試資料
const card = mockCards.standard

// 建立隨機測試資料
const randomCard = testHelpers.createRandomCard()

// 建立大量資料（效能測試）
const manyCards = testHelpers.createManyCards(1000)
```

### 測試非同步程式碼

```typescript
// Promise 測試
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})

// 錯誤測試
it('should throw error for invalid input', async () => {
  await expect(asyncFunction('invalid')).rejects.toThrow('Error message')
})
```

### 測試事件

```typescript
// EventBus 測試
it('should emit event correctly', () => {
  const callback = vi.fn()
  eventBus.on('card:created', callback)
  
  eventBus.emit('card:created', mockEventData)
  
  expect(callback).toHaveBeenCalledWith(mockEventData)
})
```

## 🚨 常見問題

### Q: 測試執行很慢怎麼辦？

A: 
1. 使用 `--watch` 模式開發
2. 使用 `--run` 模式執行單次測試
3. 只執行特定測試文件：`vitest Card.test.ts`

### Q: 如何 Debug 測試？

A:
1. 使用 `console.log` 在測試中輸出
2. 使用 `--ui` 模式開啟圖形界面
3. 在 IDE 中設置斷點

### Q: Mock 不生效怎麼辦？

A:
1. 確保在 `beforeEach` 中清除 mock
2. 檢查 mock 的時機是否正確
3. 使用 `vi.mocked()` 來獲得正確的型別

## 🎉 最佳實踐

1. **測試先行**: 遵循 TDD 流程
2. **描述性命名**: 測試名稱要清楚說明測試內容
3. **獨立測試**: 每個測試應該獨立運行
4. **適當 Mock**: 只 Mock 外部依賴，不 Mock 被測試的程式碼
5. **覆蓋邊緣情況**: 測試成功路徑和錯誤路徑
6. **保持簡單**: 一個測試只驗證一個行為

---

Happy Testing! 🎯