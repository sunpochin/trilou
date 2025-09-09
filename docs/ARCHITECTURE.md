# 🏗️ Trello Clone 技術架構說明

## 📋 文件目的

這個文件詳細說明專案的技術架構、設計模式和重要概念，幫助開發者了解系統的運作原理。

## 🌐 核心架構概念

## 🍕 Repository Pattern - 外送員模式

### 🧒 十歲孩童解釋：CardRepository = 外送員

想像你很餓，想要吃披薩：

#### ❌ **沒有外送員的世界**（組件直接呼叫 API）
- 🏃‍♀️ 你要自己跑去披薩店（記住複雜的 API 網址）
- 🗺️ 要記住披薩店在哪裡、怎麼點餐（API 格式和參數）
- 😰 如果披薩店搬家了，你就找不到了（API 改變時所有組件都要修改）
- 🤯 每個想吃披薩的人都要記住這些複雜的事情（重複的程式碼）

```javascript
// ❌ 糟糕的做法：組件直接跟 API 講話
const Card = () => {
  const updateCard = async () => {
    const response = await fetch('/api/cards/123', {
      method: 'PUT',
      body: JSON.stringify({ priority: 'high' })
    })
    if (!response.ok) throw new Error('更新失敗')
    const data = await response.json()
    return {
      ...data,
      listId: data.list_id  // 每個組件都要記得轉換格式
    }
  }
}
```

#### ✅ **有外送員的世界**（Repository Pattern）
- 📞 你只要打電話給外送員說「我要披薩」（簡單的方法呼叫）
- 🚚 外送員知道去哪裡買，怎麼送給你（Repository 處理所有複雜邏輯）
- 🏠 披薩店搬家了？外送員會處理，你完全不用知道（API 改變只需修改 Repository）
- 😌 每個想吃披薩的人都很輕鬆（組件程式碼簡潔）

```javascript
// ✅ 好的做法：透過 Repository
const Card = () => {
  const updateCard = async () => {
    // 簡單！只要跟外送員說「我要更新卡片」
    return await cardRepository.updateCard(123, { priority: 'high' })
    // 外送員會處理所有複雜的事情
  }
}
```

### 🎯 CardRepository 做什麼？

CardRepository 就是「卡片資料的外送員」，負責：

1. **🔄 資料格式轉換** - 把後端的 `list_id` 變成前端的 `listId`
2. **🛡️ 錯誤處理** - API 出錯時給你友善的錯誤訊息  
3. **📡 統一介面** - 不管後端 API 怎麼改，前端都用一樣的方法
4. **🧹 資料清理** - 把不需要的資料過濾掉，只給你需要的

### 🏗️ 實際程式碼範例

```typescript
// CardRepository.ts - 外送員
export class CardRepository {
  // 🚚 取得所有卡片（外送員去餐廳拿所有披薩）
  async getAllCards(): Promise<Card[]> {
    try {
      // 外送員知道 API 在哪裡
      const response = await $fetch('/api/cards')
      
      // 外送員幫你轉換格式（把餐廳包裝轉成家裡的盤子）
      return this.transformApiCards(response)
    } catch (error) {
      // 外送員處理錯誤（如果餐廳關門了，告訴你原因）
      throw this.handleError(error, '取得卡片失敗')
    }
  }

  // 🔄 格式轉換（把餐廳的包裝換成你家的盤子）
  private transformApiCard(apiCard: any): Card {
    return {
      id: apiCard.id,
      title: apiCard.title,
      listId: apiCard.list_id,    // snake_case → camelCase
      status: apiCard.status,
      priority: apiCard.priority, // 確保包含優先順序
      // ... 其他欄位
    }
  }
}
```

### 🎭 真實世界對照表

| 概念 | 真實世界 | 程式世界 |
|------|----------|----------|
| **你** | 餓肚子的人 | Vue 組件 |
| **外送員** | 送披薩的人 | CardRepository |
| **餐廳** | 披薩店 | 後端 API |
| **打電話訂餐** | 「我要一個夏威夷披薩」 | `updateCard(id, data)` |
| **外送員找餐廳** | 外送員知道店在哪裡 | Repository 知道 API 網址 |
| **包裝轉換** | 把店裡的盒子裝到你家盤子 | 把 `list_id` 轉成 `listId` |
| **處理問題** | 店關門時通知你 | API 錯誤時友善提示 |

### 💡 Repository Pattern 的好處

1. **🔧 容易維護** - API 改變時只需修改 Repository
2. **♻️ 可重複使用** - 多個組件可以共用同一個 Repository  
3. **🧪 容易測試** - 可以輕鬆 mock Repository 進行單元測試
4. **📝 程式碼清晰** - 組件專注 UI，Repository 專注資料
5. **🛡️ 錯誤集中處理** - 統一的錯誤處理邏輯

## 🚌 Event Bus Pattern - 組件間通訊的廣播系統

### 🎯 EventBus 的 PBL（問題導向學習）之旅

#### 📚 **問題1：為什麼組件不能直接找對方聊天？**

**🏫 生活例子：**
想像你在教室，想告訴隔壁班同學「下課了」：
- ❌ **直接跑去找**：你要知道他在哪間教室、座位在哪、他在不在
- ✅ **用廣播系統**：你對廣播說一次，所有人都聽到了

**💻 程式的問題：**
```typescript
// ❌ 壞方法：組件直接依賴
class CardComponent {
  constructor(private listComponent: ListComponent) {} // 必須知道 ListComponent
  
  addCard() {
    this.listComponent.updateCount() // 如果 ListComponent 改名就壞了
  }
}

// ✅ 好方法：透過 EventBus
eventBus.emit('card:created', { cardId: '123', title: '新卡片' })
```

#### 📚 **問題2：EventBus 怎麼解決這個問題？**

**🎯 三個簡單步驟：**

1. **📢 廣播訊息** (emit = 校長對廣播說話)
```typescript
// 在 Card.vue 裡
eventBus.emit('card:created', { 
  cardId: '123', 
  title: '買牛奶' 
})
```

2. **📻 收聽訊息** (on = 教室裝喇叭)
```typescript
// 在 ListItem.vue 裡
eventBus.on('card:created', (data) => {
  console.log(`新卡片：${data.title}`)
  updateCardCount() // 更新卡片數量
})
```

3. **🔇 停止收聽** (off = 拆掉喇叭)
```typescript
// 當組件被關閉時
onUnmounted(() => {
  eventBus.off('card:created', myCallback)
})
```

#### 📚 **問題3：實際使用場景 - 拖曳卡片**

**🎮 場景：拖曳卡片到另一個列表**

```typescript
// 1️⃣ 卡片被拖曳時
function handleCardDrop(cardId: string, newListId: string) {
  // 廣播「卡片移動了」
  eventBus.emit('card:moved', {
    cardId: cardId,
    fromListId: 'list-1',
    toListId: newListId
  })
}

// 2️⃣ 列表組件監聽移動事件
onMounted(() => {
  eventBus.on('card:moved', (data) => {
    if (data.fromListId === props.listId) {
      // 我的卡片被拿走了，數量減一
      cardCount.value--
    }
    if (data.toListId === props.listId) {
      // 收到新卡片了，數量加一
      cardCount.value++
    }
  })
})
```

#### 📚 **問題4：特殊功能 - 只聽一次**

**🎯 once = 臨時喇叭（聽完就拆）**

```typescript
// 等使用者第一次登入
eventBus.once('user:login', (data) => {
  showWelcomeMessage(`歡迎 ${data.email}！`) // 只會顯示一次
})

// 即使登入很多次，歡迎訊息只出現第一次
eventBus.emit('user:login', { email: 'user@example.com' }) // ✅ 顯示歡迎
eventBus.emit('user:login', { email: 'user@example.com' }) // ❌ 不會再顯示
```

### 🎯 **EventBus 的記憶口訣**

1. **emit = 📢 說話**（我要告訴大家一件事）
2. **on = 📻 裝喇叭**（我要聽這種廣播）
3. **off = 🔇 拆喇叭**（我不想聽了）
4. **once = ⏰ 臨時喇叭**（只聽一次就好）

### 💡 **最重要的概念**

EventBus 讓組件之間**不需要認識對方**就能溝通：
- Card 組件不知道誰在聽
- List 組件不知道誰在說
- 但訊息還是能成功傳遞！

就像學校廣播系統，校長不需要知道每間教室有誰，但廣播還是能傳到每個角落！

### 🔄 **EventBus 在 Trello Clone 的實際應用**

在我們的專案中，EventBus 處理這些重要場景：

1. **卡片操作通知**
   - 新增卡片時通知統計更新
   - 刪除卡片時通知列表重新計算
   - 移動卡片時通知相關列表更新

2. **使用者互動**
   - 登入/登出時更新全局狀態
   - 顯示通知訊息給使用者
   - 錯誤發生時統一處理

3. **組件協調**
   - 拖曳開始/結束的狀態同步
   - 選單開啟/關閉的狀態管理
   - 表單提交後的資料刷新

### 🛠️ **EventBus 最佳實務**

```typescript
// ✅ 好的命名規範
eventBus.emit('card:created', data)     // 資源:動作
eventBus.emit('user:logged-in', data)   // 清楚明確
eventBus.emit('error:api-failed', data) // 分類:細節

// ❌ 避免的命名
eventBus.emit('update', data)     // 太模糊
eventBus.emit('c', data)          // 難以理解
eventBus.emit('cardCreated', data) // 缺少命名空間

// ✅ 記得清理監聽器
const handleUpdate = (data) => { /* ... */ }

onMounted(() => {
  eventBus.on('card:updated', handleUpdate)
})

onUnmounted(() => {
  eventBus.off('card:updated', handleUpdate) // 避免記憶體洩漏
})

// ✅ 使用 TypeScript 型別定義
interface AppEvents {
  'card:created': { cardId: string, title: string }
  'card:deleted': { cardId: string }
  // ... 其他事件
}
```

### 🎭 **EventBus vs Pinia Store**

| 使用場景 | EventBus | Pinia Store |
|---------|----------|-------------|
| **狀態管理** | ❌ 不適合 | ✅ 最佳選擇 |
| **一次性通知** | ✅ 最佳選擇 | ❌ 過度設計 |
| **跨組件通訊** | ✅ 簡單快速 | ✅ 也可以但較重 |
| **資料持久化** | ❌ 沒有記憶 | ✅ 保存狀態 |
| **時間旅行除錯** | ❌ 不支援 | ✅ DevTools 支援 |

**簡單判斷法：**
- 需要「記住」資料？用 **Pinia Store**
- 只是「通知」事件？用 **EventBus**

### defineEventHandler vs Event Bus Pattern

這是兩個經常被混淆但完全不同的概念：

#### 🌐 `defineEventHandler` - Nuxt 3 的 API 路由處理器

```typescript
// server/api/cards/[id].put.ts
export default defineEventHandler(async (event) => {
  // 處理 HTTP 請求
})
```

**這是什麼？**
- 這是 **Nuxt 3/Nitro 框架** 的 API 路由系統
- 用來處理 **HTTP 請求**（GET, POST, PUT, DELETE）
- `event` 參數代表一個 **HTTP 請求事件**，包含：
  - 請求的 URL、方法、headers
  - 請求 body 資料
  - 回應物件

**十歲孩童解釋：**
- 想像你家有個「信箱管理員」（defineEventHandler）
- 當郵差送信來時（HTTP 請求），管理員會：
  1. 檢查信件地址（URL 路由）
  2. 打開信件讀內容（request body）
  3. 決定怎麼處理（業務邏輯）
  4. 寫回信（HTTP 回應）

#### 🚌 Event Bus Pattern - 前端組件間通訊

```typescript
// events/EventBus.ts
eventBus.emit('card:updated', cardData)
eventBus.on('card:updated', callback)
```

**這是什麼？**
- 這是 **前端組件間** 的事件通訊機制
- 讓不同的 Vue 組件可以互相傳遞訊息
- 不涉及 HTTP 請求，純粹是記憶體中的事件

**十歲孩童解釋：**
- 想像教室裡有個「廣播系統」（Event Bus）
- 當小明完成作業時，他對著麥克風說：「我完成了！」
- 老師和其他同學都能聽到，並做相應的反應
- 這個廣播只在教室內（瀏覽器內），不會傳到外面

#### 📊 對照表

| 特性 | defineEventHandler | Event Bus Pattern |
|------|-------------------|-------------------|
| **位置** | 後端 Server API | 前端 Browser |
| **用途** | 處理 HTTP 請求 | 組件間通訊 |
| **觸發方式** | HTTP 請求（fetch/axios） | JavaScript 事件 |
| **資料流向** | Client ↔ Server | Component ↔ Component |
| **持久性** | 會寫入資料庫 | 僅存在記憶體中 |

### 🔄 實際流程範例：更新卡片優先順序

當你點擊 Priority 按鈕時的完整流程：

```typescript
// 1. 前端組件 (Card.vue) - UI 互動
const togglePriority = () => {
  const newPriority = getNextPriority(currentPriority)
  emit('updatePriority', props.card.id, newPriority)
}

// 2. 父組件 (ListItem.vue) - 業務邏輯協調
const handleCardPriorityUpdate = async (cardId, priority) => {
  // 樂觀更新：立即更新本地狀態
  boardStore.updateCardPriority(cardId, priority)
  
  try {
    // 發送 HTTP 請求到後端 API 同步到資料庫
    const response = await $fetch(`/api/cards/${cardId}`, {
      method: 'PUT',
      body: { priority }
    })
    console.log('✅ 優先順序更新成功')
  } catch (error) {
    console.error('❌ 更新失敗，重新載入資料')
    // 失敗時觸發重新載入
    emit('card-updated')
  }
}

// 3. 後端 API (server/api/cards/[id].put.ts) - 資料持久化
export default defineEventHandler(async (event) => {
  // 🔐 權限檢查
  const userId = await getUserId(event)
  
  // 📋 取得請求資料
  const cardId = getRouterParam(event, 'id')
  const { priority } = await readBody(event)
  
  // 🔍 檢查卡片擁有權
  const hasAccess = await checkCardAccess(cardId, userId)
  if (!hasAccess) {
    throw createError({ statusCode: 403, message: '沒有權限' })
  }
  
  // 💾 更新資料庫
  const result = await supabase
    .from('cards')
    .update({ priority })
    .eq('id', cardId)
    .select()
    .single()
  
  return result
})

// 4. (可選) 如果需要通知其他組件 - Event Bus
eventBus.emit('card:priority-updated', { 
  cardId, 
  priority,
  timestamp: Date.now()
})

// 5. (可選) 其他組件監聽事件
eventBus.on('card:priority-updated', (data) => {
  // 更新統計、發送通知等
  updatePriorityStatistics(data)
  showToast(`卡片優先順序已更新為 ${data.priority}`)
})
```

## 🎯 為什麼要這樣設計？

### 💡 **職責分離原則 (Separation of Concerns)**
- **defineEventHandler**: 專門負責資料持久化、安全檢查、業務規則
- **Event Bus**: 專門負責 UI 同步、跨組件通訊、用戶體驗

### 🚀 **效能最佳化**
- **HTTP 請求**: 比較慢，用來處理重要的資料更新
- **Event Bus**: 非常快，用來即時更新 UI 和狀態

### 🔒 **安全考量**
- **HTTP API**: 在伺服器端執行，可以做完整的權限檢查、資料驗證
- **Event Bus**: 只在瀏覽器中運行，不會暴露敏感資料

### 🔄 **可維護性**
- **單向資料流**: HTTP 請求 → 資料庫 → 狀態更新 → UI 重新渲染
- **責任清晰**: 每個層級都有明確的職責，容易除錯和擴展

## 🛠️ 開發最佳實務

### 1. **樂觀更新 (Optimistic Updates)**
```typescript
// ✅ 好的做法：先更新 UI，再同步資料庫
const updateCard = async (cardId, changes) => {
  // 1. 立即更新本地狀態
  store.updateCard(cardId, changes)
  
  try {
    // 2. 背景同步到資料庫
    await api.updateCard(cardId, changes)
  } catch (error) {
    // 3. 失敗時回滾或重新載入
    store.revertCard(cardId) // 或 store.reloadBoard()
  }
}
```

### 2. **錯誤處理策略**
```typescript
// ✅ 分層錯誤處理
try {
  await updateCardAPI(cardId, data)
} catch (error) {
  if (error.statusCode === 403) {
    // 權限問題：重新登入
    redirectToLogin()
  } else if (error.statusCode >= 500) {
    // 伺服器問題：重試或降級
    showRetryDialog()
  } else {
    // 其他問題：顯示錯誤訊息
    showErrorToast(error.message)
  }
}
```

### 3. **Event Bus 使用指南**
```typescript
// ✅ 使用命名空間避免衝突
eventBus.emit('card:status-updated', data)    // 好
eventBus.emit('card:priority-changed', data)  // 好
eventBus.emit('updated', data)                // 不好，太模糊

// ✅ 記得清理監聽器
onUnmounted(() => {
  eventBus.off('card:updated', handleCardUpdate)
})
```

## 📚 相關文件

- [README.md](./README.md) - 專案基本說明和快速開始
- [CLAUDE.md](./CLAUDE.md) - 開發規範和專案結構
- [components/](./components/) - 各組件的詳細註釋
- [server/api/](./server/api/) - API 端點說明

## 🤝 貢獻指南

當你要新增功能或修改架構時：

1. **先理解現有的資料流向**
2. **確定是否需要 HTTP API 或只是 Event Bus**
3. **遵循樂觀更新的模式**
4. **加上適當的錯誤處理**
5. **更新相關文件和註釋**

---

💡 **記住：好的架構不是一開始就完美的，而是在開發過程中不斷改進的。**