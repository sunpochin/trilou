# API 使用說明

這個 API 為 Trello clone 專案提供了完整的 CRUD 操作，包括看板、列表和卡片的管理。

## API 端點一覽

### 看板 (boards)
- `GET /api/boards` - 獲取所有看板
- `POST /api/boards` - 建立新看板
- `GET /api/boards/{id}` - 獲取特定看板
- `PUT /api/boards/{id}` - 更新看板
- `DELETE /api/boards/{id}` - 刪除看板

### 列表 (lists)  
- `GET /api/lists` - 獲取列表（可用 `?board_id=` 篩選）
- `POST /api/lists` - 建立新列表
- `GET /api/lists/{id}` - 獲取特定列表
- `PUT /api/lists/{id}` - 更新列表
- `DELETE /api/lists/{id}` - 刪除列表

### 卡片 (cards)
- `GET /api/cards` - 獲取卡片（可用 `?list_id=` 篩選）
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

### 獲取特定看板的所有列表
```javascript
const lists = await $fetch('/api/lists', {
  query: { board_id: 'board-id-123' }
})
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

## 注意事項

1. **目前狀態**: 所有 API 端點目前返回模擬資料，標記了 `TODO` 的地方之後會串接 Supabase
2. **錯誤處理**: 所有端點都有適當的錯誤處理和驗證
3. **型別安全**: 使用 TypeScript 型別定義確保資料一致性
4. **RESTful 設計**: 遵循 REST API 設計原則

## 後續整合 Supabase

當準備整合 Supabase 時，需要：
1. 安裝 Supabase 客戶端 (`npm install @supabase/supabase-js`)
2. 設定環境變數 (SUPABASE_URL, SUPABASE_ANON_KEY)
3. 建立資料庫表格結構
4. 替換模擬資料為實際的 Supabase 查詢


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

