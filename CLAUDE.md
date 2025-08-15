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

## 注意事項
- 所有程式碼都需要 TypeScript 型別定義
- 組件需要適當的中文註解說明功能
- 使用 `@/` 別名而非相對路徑導入