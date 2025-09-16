# Trello Clone 專案

## 專案描述
這是一個使用 Nuxt 3 + Vue 3 + TypeScript + Pinia 開發的 Trello 看板 clone 專案。

## 技術棧
- **Nuxt 3** - Vue.js 框架
- **Vue 3** - 前端框架  
- **TypeScript** - 型別安全
- **Pinia** - 狀態管理
- **Yarn** - 套件管理器

## 開發規範

### 程式碼風格
- **所有新產生的程式碼都必須包含適當長度的中文註解**
- 使用 TypeScript，所有檔案使用 `.ts` 或 `.vue` 副檔名
- 使用 `@/` 路徑別名來引用專案根目錄
- 組件命名使用 PascalCase
- 變數和函數命名使用 camelCase

### 路徑別名配置
- `@/` 指向專案根目錄
- `@/components/` 指向組件目錄
- `@/stores/` 指向狀態管理目錄

## 專案結構
```
├── app/                 # 應用程式進入點
├── components/          # Vue 組件
│   ├── TrelloBoard.vue  # 主看板組件（重構後）
│   ├── ListItem.vue     # 單個列表組件
│   ├── ListMenu.vue     # 列表選單組件
│   └── Card.vue         # 卡片組件
├── composables/         # 可重用邏輯
│   └── useListActions.ts # 列表操作業務邏輯
├── stores/             # Pinia 狀態管理
├── public/             # 靜態資源
├── nuxt.config.ts      # Nuxt 配置
└── package.json        # 專案依賴
```

## 開發指令
```bash
# 安裝依賴
yarn install

# 開發模式
yarn dev

# 建置專案
yarn build
```

## 狀態管理
使用 Pinia 管理應用狀態，主要的 store：
- `boardStore.ts` - 看板、列表、卡片的狀態管理

## 架構設計原則

### SOLID 原則應用
這個專案在重構過程中應用了 SOLID 原則來提升程式碼品質：

- **S (Single Responsibility)** - 每個組件只負責一個特定功能
  - `TrelloBoard.vue` - 只處理整體佈局
  - `ListItem.vue` - 只處理單個列表
  - `ListMenu.vue` - 只處理選單邏輯
  - `useListActions.ts` - 只處理列表業務邏輯

- **O (Open/Closed)** - 對擴展開放，對修改封閉
  - 新增功能時不需要修改現有組件核心邏輯
  - 透過 emit 事件和 composables 來擴展功能

- **D (Dependency Inversion)** - 依賴抽象而非具體實作
  - 組件透過 `useListActions` 而非直接使用 `boardStore`
  - 方便未來更換資料來源或邏輯實作

### 組件分離策略
- **關注點分離** - UI 組件專注渲染，業務邏輯抽離到 composables
- **可重用性** - composables 可在多個組件間共享
- **可測試性** - 每個組件和 composable 都可獨立測試

### Design Patterns 應用

為了實現「高內聚低耦合」的架構，專案中應用了多種設計模式：

#### **Repository Pattern (倉庫模式)**
- **位置**: `repositories/CardRepository.ts`
- **目的**: 統一資料存取邏輯，隔離 API 實作細節
- **好處**: 要換 API 只需修改 Repository，組件完全不受影響

#### **Builder Pattern (建造者模式)**  
- **位置**: `builders/NotificationBuilder.ts`
- **目的**: 建立複雜的通知物件，提供流暢的 API
- **使用**: `NotificationBuilder.success('操作成功').setDuration(3000).build()`

#### **Strategy Pattern (策略模式)**
- **位置**: `validators/ValidationStrategy.ts`  
- **目的**: 分離不同的驗證邏輯，易於擴展和測試
- **好處**: 新增驗證規則不影響現有程式碼

#### **Observer Pattern (觀察者模式)**
- **位置**: `events/EventBus.ts`
- **目的**: 組件間鬆散耦合的事件通訊
- **使用**: `eventBus.emit('card:created', data)` / `eventBus.on('card:created', callback)`

#### **Factory Pattern (工廠模式)**
- **位置**: `factories/EntityFactory.ts`
- **目的**: 統一實體建立邏輯，確保資料一致性
- **好處**: 集中管理 ID 生成、預設值設定等邏輯

#### **🏠 高內聚低耦合的十歲小朋友解釋**

**🔗 高內聚 = 房間裡的東西很相關**
- 廚房裡放的都是煮飯用具（鍋子、盤子、爐子）
- 浴室裡放的都是洗澡用具（毛巾、肥皂、牙刷）  
- 不會在廚房裡放床，也不會在浴室裡放電視

**🔗 低耦合 = 房間之間不會互相干擾**
- 裝修廚房不會影響到浴室
- 浴室壞了也不會讓廚房不能用
- 每個房間都可以獨立運作

**🎯 在我們專案中的實現：**
- **高內聚**: 
  - 驗證檔案只處理檢查邏輯
  - 通知檔案只處理訊息顯示
  - 工廠檔案只處理物件建立
- **低耦合**:
  - 組件不直接跟 API 講話（透過 Repository）
  - 組件之間不直接溝通（透過 EventBus）
  - 複雜邏輯不寫在組件裡（透過 Composables）

**💡 簡單記憶法：**
- 高內聚 = 相關的東西放一起
- 低耦合 = 不相關的東西分開住


## 專案文件

### 技術文件
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - 技術架構詳細說明
  - defineEventHandler vs Event Bus Pattern 的差異
  - 資料流向和最佳實務
  - 樂觀更新策略
  - 錯誤處理指南
- **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - 故障排查指南
  - 拖曳功能問題修復記錄
  - API 錯誤處理方案

### 開發文件
- **[README.md](./README.md)** - 專案基本說明和快速開始
- **[CLAUDE.md](./CLAUDE.md)** - 本檔案，開發規範和專案結構

## 注意事項
- Do not access boardStore directly from components, use composables instead.
- 使用繁體中文台灣用語。專有名詞可以用英文，例如，不要使用「克隆」，使用 clone 比較好。
- 所有程式碼都需要 TypeScript 型別定義
- 組件需要適當的中文註解說明功能
- 使用 `@/` 別名而非相對路徑導入
- 遵循 SOLID 原則進行組件設計和重構

# CLAUDE.md – Code Review Guidelines

## 專案技術堆疊
- Vue 3 + Nuxt (部分仍有 Vue 2 舊程式碼)
- JavaScript (ES2020+)
- HTML5 / CSS3
- **沒有 TypeScript**（請不要建議轉 TS）

---

## 代碼風格
- 使用 ESLint + Prettier 的預設規則  
- 縮排：2 spaces  
- 單引號 `'`，避免雙引號 `"`  
- 儘量用 `const` / `let`，避免 `var`  
- 行尾不要加分號（除非必要）  
- 刪掉無用的 import 與註解  

---

## Vue / Nuxt 規範
- 元件名稱：PascalCase (e.g. `UserProfile.vue`)  
- Props 命名：camelCase（在 template 用時轉 kebab-case）  
- 每個元件應保持單一責任，避免膨脹  
- 優先使用 `<script setup>` 語法  
- 避免在 `mounted` 放過多邏輯，能拆就拆  

---

## CSS / 樣式
- 優先使用 Tailwind CSS utility classes  
- 自訂樣式統一放在 `assets/css/`，避免直接在 `.vue` 檔過度膨脹  
- class 命名遵循 BEM（block__element--modifier）  

---

## 錯誤處理
- `async/await` 必須加上 try/catch  
- API 呼叫需經過統一的 `api/` 模組，不要散落在元件內  
- 避免在元件內直接 `console.log`，如需 debug 請暫時註解或使用 logger  

---

## 前端效能檢查

### 一般原則
- 保持打包體積小，避免引入不必要的第三方套件  
- 檢查是否有可重複利用的元件，避免重複程式碼  
- 避免在 template 直接放複雜運算，應搬到 computed 或 methods  

### Vue / Nuxt 特有
- 使用 Nuxt 的 **lazy loading** 功能：  
  - route-level code splitting (`defineAsyncComponent` 或 `lazy: true`)  
  - dynamic imports (`import()`) 而非一次載入整包  
- 確認元件僅在需要時才載入，避免首頁過度載入  
- SSR 頁面檢查 hydration 是否正確，避免不必要 re-render  

### 資源最佳化
- 圖片：優先使用 `.webp` 或 `.avif`  
- icon：使用 SVG sprite 或 icon library，避免多個獨立檔案  
- CSS/JS：確認 tree-shaking 有效，未使用代碼不應打包  

### API / 資料處理
- API 請求應有 cache 機制，避免重複呼叫  
- 大量資料使用 pagination 或 infinite scroll  
- 資料轉換應交由後端處理，避免前端過重  

### 監控與診斷
- 檢查是否有監控 Web Vitals (LCP, FID, CLS)  
- 避免在 production 留下 debug 工具或開發用 console.log  

---

## 其他原則
- 保持函式純粹，減少對全域狀態依賴  
- README 或註解應有助於後續維護者理解  
- 可讀性優先於微小的效能優化  

---

## Claude Review 提醒
1. 請特別檢查是否有 **未使用的變數 / console.log**。  
2. 確認代碼是否依循 **Vue / Nuxt 最佳實踐**。  
3. 如有安全性風險（XSS, API error 未處理），需標出。  
4. 避免雞毛蒜皮的風格建議，保持建議簡潔有價值。  