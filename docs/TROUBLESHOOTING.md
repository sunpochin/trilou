# 故障排查指南

這個文件記錄了專案開發過程中遇到的問題和解決方案，幫助開發者快速診斷和修復類似問題。

## 拖曳功能問題修復記錄

### 問題：卡片拖動時卡住無法移動

**症狀：**
- 開始拖動卡片後，卡片會凍結在傾斜狀態
- 卡片寬度異常放大，超出螢幕範圍
- 需要重新整理頁面才能恢復

**根本原因分析：**

1. **全域 CSS 衝突**（`app.vue`）
   ```css
   /* 問題 CSS */
   .sortable-fallback {
     transform: rotate(5deg);    /* 卡片異常傾斜 */
     position: fixed;            /* 定位錯誤 */
     pointer-events: none;       /* 滑鼠事件失效 */
     width: 100vw;              /* 寬度異常放大 */
   }
   ```

2. **雙重控制衝突**（`ListItem.vue`）
   ```vue
   <!-- 問題寫法 -->
   <draggable v-model="list.cards" @end="handleCardDrop">
   ```
   Vue 和 SortableJS 同時嘗試控制同一個陣列，導致衝突。

3. **事件時機錯誤**
   - `@end`：拖動完全結束才觸發（太晚）
   - `@change`：資料變化時立即觸發（正確）

**解決方案：**

1. **修復全域 CSS**
   ```css
   /* 安全的後備樣式 */
   .sortable-fallback,
   .card-fallback {
     opacity: 0.8 !important;
     box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3) !important;
     border: 2px solid #10b981 !important;
     background: rgba(255, 255, 255, 0.95) !important;
   }
   ```

2. **採用單向綁定模式**
   ```vue
   <!-- 正確寫法 -->
   <draggable
     :list="list.cards"           <!-- 單向綁定避免衝突 -->
     group="cards"                <!-- 允許跨列表拖動 -->
     @change="handleCardChange"   <!-- 即時響應變化 -->
     ghostClass="card-ghost"      <!-- 自訂 CSS 類別 -->
     chosenClass="card-chosen"
     dragClass="card-dragging"
     fallbackClass="card-fallback"
     :force-fallback="true"       <!-- 強制使用後備模式 -->
   >
   ```

3. **使用自訂 CSS 類別**
   ```css
   /* 避免與全域樣式衝突 */
   .card-chosen { /* 被選中時的樣式 */ }
   .card-dragging { /* 拖動中的樣式 */ }
   .card-ghost { /* 佔位符樣式 */ }
   ```

**關鍵洞察：**
- `v-model` = 雙向綁定 = 容易產生控制權衝突
- `:list` = 單向綁定 = 清楚的控制權歸屬
- 自訂 CSS 類別名稱可避免全域樣式污染

**最佳實務建議：**
- 避免在 fallback 元素上使用全域 CSS
- 優先使用專屬的 CSS 類別（如 `card-chosen`、`card-dragging`、`card-ghost`）
- vue-draggable 實作應從 `v-model + @end` 轉換為 `:list + @change`

**相關檔案：**
- `app.vue` - 全域樣式修復
- `components/ListItem.vue` - 拖曳組件配置
- `components/Card.vue` - 卡片樣式定義

---

## API 錯誤處理方案

### 新增卡片 API 錯誤

#### 問題：新增卡片時出現 500 錯誤

**症狀：**
- 點擊「新增卡片」按鈕失敗
- 控制台顯示：`invalid input value for enum card_status: "medium"`

**根本原因：**
資料庫的 `cards` 表有兩個 enum 欄位：
- `status`：接受 `'todo'`, `'doing'`, `'done'`
- `priority`：接受 `'high'`, `'medium'`, `'low'`

程式碼錯誤地將 `'medium'`（priority 的值）傳給了 `status` 欄位。

**解決方案：**

1. **修復 API 端點**（`server/api/cards/index.post.ts`）
   ```typescript
   // 建立新卡片時同時設定預設值
   const { data, error } = await supabase
     .from('cards')
     .insert({
       title: body.title,
       description: body.description,
       position: position,
       list_id: body.list_id,
       status: body.status || 'todo',        // 預設狀態
       priority: body.priority || 'medium'   // 預設優先級
     })
   ```

2. **更新資料流鏈路**
   - `CardRepository.createCard()` - 加入 priority 參數
   - `boardStore.addCard()` - 支援 priority 傳遞
   - `useCardActions.addCard()` - 更新函數簽名

**相關檔案：**
- `server/api/cards/index.post.ts` - API 端點
- `repositories/CardRepository.ts` - 資料存取層
- `stores/boardStore.ts` - 狀態管理
- `composables/useCardActions.ts` - 業務邏輯層

### 其他常見 API 錯誤處理

#### 樂觀更新失敗回滾

**問題描述：**
當 API 請求失敗時，UI 已經樂觀更新的資料需要正確回滾。

**解決方案：**
```typescript
// 使用備份資料進行回滾
const backupData = structuredClone(currentData);
try {
  // 樂觀更新 UI
  updateUI(newData);
  // 發送 API 請求
  await apiCall(newData);
} catch (error) {
  // 失敗時回滾
  updateUI(backupData);
  showErrorNotification(error);
}
```

#### API 超時處理

**問題描述：**
API 請求可能因網路問題超時。

**解決方案：**
```typescript
// 設定合理的超時時間
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, {
    signal: controller.signal
  });
  clearTimeout(timeout);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('請求超時');
  }
}
```
