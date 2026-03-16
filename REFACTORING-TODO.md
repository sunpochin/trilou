# Trilou 重構 TODO 清單 (Code Smells)

這份文件記錄了在 Trilou 專案中發現的程式碼異味 (Code Smells) 以及相應的重構建議。

## 1. 巨大組件 (God Components / Fat Components)
- **問題位置**: `app.vue` (17KB), `components/ListItem.vue` (25KB), `components/MobileBoard.vue` (30KB)
- **說明**: 這些組件體積過大，承擔了過多職責。例如 `MobileBoard.vue` 同時處理 UI 渲染、視圖邏輯、VueDraggable 拖拉處理、以及自訂的手勢偵測 (`useGesture`)。
- **重構建議**: 
  - 將龐大的組件拆分為更小的子組件。
  - 把複雜的 DOM 手勢控制、拖拉邏輯進一步抽取成乾淨的 Composables。

## 2. 認證與佈局邏輯高度耦合
- **問題位置**: `app.vue`
- **說明**: `app.vue` 包含了完整的 Magic Link 認證邏輯（`signInWithEmail`）、測試帳號登入、甚至還包含了所有的全域對話框 (Dialogs) 與佈局 UI。這違反了單一職責原則。
- **重構建議**: 
  - 引入 Nuxt 的 `pages/` 和 `layouts/` 系統。
  - 將登入相關的 UI 與邏輯抽離到 `pages/login.vue` 或獨立的 `AuthComponents`。
  - 將 Dialogs 與 Layout 移至 `layouts/default.vue`。

## 3. 資料存取層 (API) 呼叫方式不一致
- **問題位置**: `stores/boardStore.ts`
- **說明**: Store 內部混合了兩種 API 呼叫方式。有些地方使用了 Repository 模式（例如 `listRepository.getAllLists()` 和 `cardRepository.createCard()`），但有些地方卻直接寫死 `$fetch`（例如 `addList` 和 `removeList` 直接調用 `/api/lists`）。
- **重構建議**: 
  - 統一使用 Repository Pattern，將所有直接的 `$fetch` 呼叫移至 `ListRepository` 與 `CardRepository` 中，保持 Store 的乾淨與關注點分離。

## 4. Props 超載與事件冒泡 (Prop Drilling & Event Bubbling)
- **問題位置**: `components/MobileBoard.vue`, `components/ListItem.vue`
- **說明**: 由於組件層級複雜，底層組件（如卡片或列表）觸發的事件被過度往上 `emit`。在 `ListItem.vue` 中有近 10 個 `emit` 事件（`@card-move`, `@open-card-modal`, `@card-delete`, `@drag-start`, 等等），這使得父組件的 template 變得極端龐大且難以維護。
- **重構建議**: 
  - 讓較底層的智慧組件 (Smart Components) 直接與 Composables 或 Pinia Store 溝通，減少無意義的事件向上丟。
  - 更有系統地使用 Vue 的 `provide` / `inject`。

## 5. UI 狀態與領域資料混合
- **問題位置**: `stores/boardStore.ts`
- **說明**: Store 同時儲存了領域資料（Domain state，如 `board`, `lists`, `cards`）以及 UI 狀態（UI state，如 `openMenuId`, `pendingAiCards`）。
- **重構建議**: 
  - 將 UI 相關的控制狀態拆分到組件本地狀態（Local State）或是獨立的 `useUIStore` 中。

## 6. 樣式區塊過於龐大且包含全域魔法樣式
- **問題位置**: `app.vue`, `components/ListItem.vue`
- **說明**: `<style scoped>` 中包含了幾百行的 CSS 動畫邏輯（例如 `ai-rainbow-magic`），這讓 Vue 檔案變得難以閱讀。
- **重構建議**: 
  - 將複雜的 CSS 動畫獨立到 `assets/css/` 的獨立樣式表中。
  - 盡量統一使用 TailwindCSS 功能來減少手寫 CSS 的負擔。

