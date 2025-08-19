# API 使用說明

這個 API 為 Trello clone 專案提供了完整的 CRUD 操作，包括看板、列表和卡片的管理。

## API 端點一覽

### 🚀 看板完整資料 (優化後的主要端點)
- `GET /api/board` - **一次性獲取完整看板資料**（包含所有 lists 和 cards，使用 JOIN 查詢優化性能）

### 列表 (lists)  
- `POST /api/lists` - 建立新列表
- `GET /api/lists/{id}` - 獲取特定列表
- `PUT /api/lists/{id}` - 更新列表
- `DELETE /api/lists/{id}` - 刪除列表

### 卡片 (cards)
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

### 獲取完整看板資料（推薦使用）
```javascript
// 🚀 一次性獲取看板、所有列表和卡片
const boardData = await $fetch('/api/board')
// 回傳格式：
// {
//   id: 'board-1',
//   title: 'My Board',
//   lists: [
//     {
//       id: 'list-1',
//       title: 'To Do',
//       cards: [
//         { id: 'card-1', title: 'Task 1', description: '...', position: 0 },
//         { id: 'card-2', title: 'Task 2', description: '...', position: 1 }
//       ]
//     }
//   ]
// }
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

## 性能優化

### 🚀 主要改進
- **`GET /api/board`** 使用 JOIN 查詢，一次性獲取完整看板資料
- **減少網路往返** 從原本 2 次 API 調用優化為 1 次
- **自動降級機制** 如果 JOIN 失敗會降級到優化的分別查詢
- **智慧排序** 確保 lists 和 cards 按 position 正確排序

## 注意事項

1. **性能優先**: 使用 `GET /api/board` 來載入初始資料，避免使用已移除的 `GET /api/lists` 和 `GET /api/cards`
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

