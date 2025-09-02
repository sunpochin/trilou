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
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 技術架構詳細說明
  - defineEventHandler vs Event Bus Pattern 的差異
  - 資料流向和最佳實務
  - 樂觀更新策略
  - 錯誤處理指南

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

