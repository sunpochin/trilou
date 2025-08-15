# Trello Clone 看板專案

一個使用現代化技術棧開發的 Trello 看板克隆專案，具備完整的拖拉放置功能和響應式設計。

## DEMO

https://trello-clone-gamma-lac.vercel.app/

## ✨ 專案特色

- 🎯 **完整的看板功能** - 支援多列表管理和卡片操作
- 🖱️ **拖拉放置** - 可在列表內排序和跨列表移動卡片
- 🎨 **Tailwind CSS** - 現代化的 utility-first CSS 框架
- 📱 **響應式設計** - 適配各種螢幕尺寸
- ⚡ **快速開發** - 使用 Nuxt 3 和 Vite 構建工具
- 🔄 **狀態管理** - 使用 Pinia 進行集中化狀態管理
- 📝 **TypeScript 支援** - 完整的型別安全

## 🛠️ 技術棧

| 技術 | 用途 |
|------|------|
| **Nuxt 3** | Vue.js 全端框架 |
| **Vue 3** | 前端 UI 框架 |
| **TypeScript** | 型別安全的 JavaScript |
| **Pinia** | 狀態管理庫 |
| **Tailwind CSS** | CSS 框架 |
| **VueDraggable** | 拖拉放置功能 |
| **Yarn** | 套件管理器 |

## 🚀 快速開始

### 環境要求

- Node.js 20.19.0+ 
- Yarn 1.22+

### 安裝步驟

```bash
# 1. 複製專案
git clone git@github.com:sunpochin/trello-clone.git
cd trello-clone

# 2. 安裝依賴
yarn install

# 3. 啟動開發伺服器
yarn dev
```

開發伺服器將在 `http://localhost:3000/` 啟動

### 其他指令

```bash
# 建置生產版本
yarn build

# 預覽生產版本
yarn preview

# 生成靜態檔案
yarn generate
```

## 📁 專案結構

```
trello-clone/
├── app/                    # 應用程式進入點
│   └── app.vue
├── components/             # Vue 組件
│   ├── Card.vue           # 卡片組件
│   └── TrelloBoard.vue    # 看板主組件
├── stores/                 # Pinia 狀態管理
│   └── boardStore.ts      # 看板狀態管理
├── public/                 # 靜態資源
├── nuxt.config.ts         # Nuxt 配置檔
├── package.json           # 專案依賴
├── CLAUDE.md              # 開發規範
└── README.md              # 專案說明
```

## 🎮 功能介紹

### 基本功能

- ✅ **多列表管理** - 預設包含 "To Do"、"In Progress"、"Done" 三個列表
- ✅ **卡片管理** - 新增、刪除、編輯卡片
- ✅ **拖拉排序** - 在同一列表內重新排序卡片
- ✅ **跨列表移動** - 將卡片拖拉到不同列表

### 使用方式

1. **新增卡片**：點擊列表底部的「+ 新增」按鈕
2. **拖拉卡片**：滑鼠拖拉卡片到目標位置
3. **移動卡片**：拖拉卡片到其他列表進行狀態變更

### 狀態管理

專案使用 Pinia 進行狀態管理，主要包含：

- `board` - 看板資料（標題、列表）
- `lists` - 列表陣列（包含卡片）
- `cards` - 卡片陣列（標題、ID）

## 🎨 樣式設計

使用 Tailwind CSS 進行樣式開發：

- **設計系統** - 統一的色彩和間距規範
- **響應式** - 支援手機、平板、桌面裝置
- **互動效果** - hover、transition 等使用者體驗優化
- **無障礙** - 符合基本的無障礙設計準則

## 🔧 開發規範

### 程式碼風格

- 使用 TypeScript 進行型別檢查
- 所有新程式碼需包含適當的中文註解
- 使用 `@/` 路徑別名引用檔案
- 遵循 Vue 3 Composition API 寫法

### 檔案命名

- 組件使用 PascalCase：`TrelloBoard.vue`
- 檔案使用 camelCase：`boardStore.ts`
- 常數使用 UPPER_CASE

詳細開發規範請參考 [CLAUDE.md](./CLAUDE.md)

## 🐛 已知問題

- 拖拉功能在某些舊版瀏覽器可能不穩定
- 大量卡片時可能影響效能

## 🗺️ 路線圖

- [ ] 新增列表功能
- [ ] 卡片詳細資訊編輯
- [ ] 使用者認證系統
- [ ] 即時協作功能
- [ ] 資料持久化（API 整合）
- [ ] 深色模式支援

## 📄 授權條款

MIT License

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m '新增很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📞 聯絡資訊

如有問題或建議，歡迎聯絡開發團隊。

**開發時間**：2025年8月
