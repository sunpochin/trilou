# API 使用說明

這個 API 為 Trello clone 專案提供了完整的 CRUD 操作，包括看板、列表和卡片的管理。

## API 端點一覽

### 列表 (lists)  
- `GET /api/lists` - 獲取列表（按 position 排序）
- `POST /api/lists` - 建立新列表
- `GET /api/lists/{id}` - 獲取特定列表
- `PUT /api/lists/{id}` - 更新列表
- `DELETE /api/lists/{id}` - 刪除列表

### 卡片 (cards)
- `GET /api/cards` - 獲取卡片（可用 `?list_id=` 篩選，按 list_id, position 排序）
- `POST /api/cards` - 建立新卡片
- `GET /api/cards/{id}` - 獲取特定卡片
- `PUT /api/cards/{id}` - 更新卡片（支援移動到不同列表）
- `DELETE /api/cards/{id}` - 刪除卡片

## 使用範例

### 建立看板
```javascript
const response = await $fetch('/api/boards', {
  method: 'POST',
  body: {
    title: '我的專案看板',
    description: '專案管理看板'
  }
})
```

### 獲取完整看板資料
```javascript
// 🎯 分開查詢，確保排序正確
const [lists, cards] = await Promise.all([
  $fetch('/api/lists'),
  $fetch('/api/cards')
])

// 手動組合資料
const cardsByListId = {}
cards.forEach(card => {
  if (!cardsByListId[card.list_id]) {
    cardsByListId[card.list_id] = []
  }
  cardsByListId[card.list_id].push(card)
})

const boardData = lists.map(list => ({
  ...list,
  cards: cardsByListId[list.id] || []
}))
```

### 移動卡片到不同列表
```javascript
const updatedCard = await $fetch('/api/cards/card-id-123', {
  method: 'PUT',
  body: {
    list_id: 'new-list-id',
    position: 0
  }
})
```

## 架構設計

### 🎯 簡單可靠的分開查詢
- **分開的 API 端點** 讓邏輯更清晰，除錯更容易
- **明確的排序邏輯** `/api/lists` 按 position，`/api/cards` 按 list_id, position
- **手動組合資料** 在前端完全掌控資料結構
- **穩定性優先** 簡單的邏輯比複雜的優化更可靠

## 注意事項

1. **排序保證**: `/api/cards` 確保按照正確的順序回傳，reload 後保持卡片順序
2. **錯誤處理**: 所有端點都有適當的錯誤處理和驗證
3. **型別安全**: 使用 TypeScript 型別定義確保資料一致性
4. **RESTful 設計**: 遵循 REST API 設計原則

## Supabase 整合狀態

✅ **已完成整合**:
- 用戶認證系統
- 資料庫表格結構
- JOIN 查詢優化
- 所有 CRUD 操作


## Database Schema

### 用戶表
users
    id (UUID, PK)
    email (text, unique)
    name (text)
    avatar_url (text)
    created_at (timestamp)

### 列表表
lists
    id (UUID, PK)
    user_id (UUID, FK → users.id)
    title (text)
    position (int)
    created_at (timestamp)

### 卡片表
cards
    id (UUID, PK)
    list_id (UUID, FK → lists.id)
    title (text)
    description (text, nullable)
    due_date (timestamp, nullable)
    position (int)
    created_at (timestamp)

