# Trello Clone 專案

## 專案描述
這是一個使用 Nuxt 3 + Vue 3 + TypeScript + Pinia 開發的 Trello 看板克隆專案。

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

## 注意事項
- 所有程式碼都需要 TypeScript 型別定義
- 組件需要適當的中文註解說明功能
- 使用 `@/` 別名而非相對路徑導入
- 遵循 SOLID 原則進行組件設計和重構